import { create } from 'zustand';
import type { CartLineSelectedOption, CatalogPromotion, Category, Coupon, Customer, DeliveryZone, LayawayTerms, Product, SalePayload } from '@/types/api';
import { computePosCheckoutTotals, posAllowsCoupon, posAllowsDiscount, resolvePosCatalogSettings, type PosOrderType } from '@/utils/posTotals';
import { giftCardsAPI } from '@/api/giftCards';
import { diningAPI } from '@/api/dining';
import { posAPI } from '@/api/pos';
import { loadPosCatalog, savePosCatalog } from '@/services/offline/catalogCache';
import { getPendingOrders } from '@/services/offline/posOrders';
import type { OfflinePosOrderRecord } from '@/types/offline';
import { saveOfflinePosOrder, OFFLINE_SAVE_MESSAGE } from '@/services/offline/offlineCheckout';
import { syncAll } from '@/services/sync/syncEngine';
import { normalizeApiError } from '@/utils/errors';
import { useAuthStore } from './authStore';
import { useBranchStore } from './branchStore';
import { useNetworkStore } from './networkStore';

export type CartLine = {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  unit_id?: number | null;
  variant_id?: string | null;
  variant_name?: string | null;
  notes?: string;
  selected_options?: CartLineSelectedOption[];
};

type SplitLine = {
  vault_id: string;
  amount: string;
  payment_method: 'cash' | 'card' | 'wallet';
};

type PosState = {
  products: Product[];
  categories: Pick<Category, 'id' | 'name' | 'image'>[];
  customers: Customer[];
  coupons: Coupon[];
  promotions: CatalogPromotion[];
  deliveryZones: DeliveryZone[];
  cart: CartLine[];
  selectedCustomer: Customer | null;
  loading: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  pendingOrders: OfflinePosOrderRecord[];
  walletBalance: number | null;
  pointsBalance: number | null;
  appliedCoupon: { coupon: Coupon; discount: number } | null;
  catalogSettings: Record<string, unknown>;
  loadCatalog: () => Promise<void>;
  addProduct: (
    product: Product,
    selectedOptions?: CartLineSelectedOption[],
    variant?: { id: string; name?: string | null } | null,
  ) => void;
  updateQuantity: (lineKey: string, delta: number) => void;
  removeLine: (lineKey: string) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  submitSale: (
    paymentType: SalePayload['payment_type'],
    paid: number,
    notes?: string,
    splitLines?: SplitLine[],
    couponData?: { coupon_id: string | null; coupon_discount: number },
    manualDiscount?: number,
    extras?: SubmitSaleExtras,
  ) => Promise<{ ok: boolean; message: string; saleId?: number; queued?: boolean }>;
  refreshPendingOrders: () => Promise<void>;
  setWalletBalance: (balance: number | null) => void;
  setPointsBalance: (points: number | null) => void;
  setAppliedCoupon: (coupon: { coupon: Coupon; discount: number } | null) => void;
  restoreCartFromHold: (
    lines: CartLine[],
    customer: Customer | null,
    manualDiscount: number,
    appliedCoupon: { coupon: Coupon; discount: number } | null,
  ) => void;
  resetSession: () => void;
};

export type SubmitSaleExtras = {
  loyaltyPointsRedeemed?: number;
  loyaltyDiscount?: number;
  giftCard?: { id: number; code: string; amount: number };
  layawayTerms?: LayawayTerms | null;
  orderType?: PosOrderType;
  deliveryFee?: number;
  deliveryAddress?: string;
  deliveryPhone?: string;
  deliveryZoneId?: string | null;
  diningTableId?: string | null;
  /** When set, settle an existing table order instead of creating a new sale. */
  settleTable?: { tableId: string; orderId?: number | string | null };
};

function priceOf(product: Product, variantId?: string | null): number {
  const base = Number(product.selling_price ?? 0);
  const variant = variantId ? product.variants?.find((v) => String(v.id) === String(variantId)) : null;
  const value = base + Number(variant?.additional_price ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function selectedOptionsSignature(opts?: CartLineSelectedOption[]): string {
  if (!opts?.length) return '';
  return opts
    .map((group) => {
      const optionIds = group.options.map((option) => option.product_option_id).sort((a, b) => a - b).join(',');
      return `${group.product_option_group_id}:${optionIds}`;
    })
    .sort()
    .join('|');
}

export function cartLineKey(line: Pick<CartLine, 'product_id' | 'variant_id' | 'unit_id' | 'selected_options'>): string {
  return [
    line.product_id,
    line.variant_id ?? '',
    line.unit_id ?? '',
    selectedOptionsSignature(line.selected_options),
  ].join('__');
}

function computeOptionsPrice(opts?: CartLineSelectedOption[]): number {
  if (!opts || opts.length === 0) return 0;
  let total = 0;
  for (const g of opts) {
    if (g.pricing_type === 'group_price') {
      total += Number(g.group_price ?? 0) || 0;
    } else if (g.pricing_type === 'per_option') {
      for (const o of g.options) total += Number(o.option_price ?? 0) || 0;
    }
  }
  return Math.round(total * 100) / 100;
}

export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, line) => {
    const optionsPrice = computeOptionsPrice(line.selected_options);
    return sum + line.quantity * (line.unit_price + optionsPrice);
  }, 0);
  const discount = lines.reduce((sum, line) => sum + (line.discount || 0), 0);
  return { subtotal, discount, total: Math.max(0, subtotal - discount) };
}

export const usePosStore = create<PosState>((set, get) => ({
  products: [],
  categories: [],
  customers: [],
  coupons: [],
  promotions: [],
  deliveryZones: [],
  cart: [],
  selectedCustomer: null,
  loading: false,
  error: null,
  lastSyncedAt: null,
  pendingOrders: [],
  walletBalance: null,
  pointsBalance: null,
  appliedCoupon: null,
  catalogSettings: {},

  loadCatalog: async () => {
    set({ loading: true, error: null });
    const branchId = useBranchStore.getState().activeBranch?.id;
    const online = useNetworkStore.getState().isOnline;
    try {
      if (online && branchId) {
        const response = await posAPI.pullCatalog(branchId);
        const catalog = response.data;
        if (catalog) {
          await savePosCatalog(catalog, branchId);
          set({
            products: catalog.products ?? [],
            categories: catalog.categories ?? [],
            customers: catalog.customers ?? [],
            coupons: catalog.coupons ?? [],
            promotions: (catalog.promotions ?? []) as CatalogPromotion[],
            deliveryZones: catalog.delivery_zones ?? [],
            catalogSettings: resolvePosCatalogSettings(catalog),
            lastSyncedAt: response.data?.generated_at ?? new Date().toISOString(),
            loading: false,
          });
          await get().refreshPendingOrders();
          return;
        }
      }
      const cached = await loadPosCatalog();
      if (cached?.catalog) {
        set({
          products: cached.catalog.products ?? [],
          categories: cached.catalog.categories ?? [],
          customers: cached.catalog.customers ?? [],
          coupons: cached.catalog.coupons ?? [],
          promotions: (cached.catalog.promotions ?? []) as CatalogPromotion[],
          deliveryZones: cached.catalog.delivery_zones ?? [],
          catalogSettings: resolvePosCatalogSettings(cached.catalog),
          lastSyncedAt: cached.saved_at,
          loading: false,
        });
      } else {
        set({ loading: false, error: branchId ? 'لا توجد بيانات مخزنة لنقطة البيع' : 'اختر فرعاً أولاً' });
      }
      await get().refreshPendingOrders();
    } catch (error) {
      const cached = await loadPosCatalog();
      if (cached?.catalog) {
        set({
          products: cached.catalog.products ?? [],
          categories: cached.catalog.categories ?? [],
          customers: cached.catalog.customers ?? [],
          coupons: cached.catalog.coupons ?? [],
          promotions: (cached.catalog.promotions ?? []) as CatalogPromotion[],
          deliveryZones: cached.catalog.delivery_zones ?? [],
          catalogSettings: resolvePosCatalogSettings(cached.catalog),
          lastSyncedAt: cached.saved_at,
          loading: false,
          error: null,
        });
      } else {
        set({ loading: false, error: normalizeApiError(error).message });
      }
      await get().refreshPendingOrders();
    }
  },

  addProduct: (product, selectedOptions, variant) => {
    const current = get().cart;
    const variantId = variant?.id ?? null;
    const unitId = product.units?.find((unit) => unit.is_base)?.id ?? product.units?.[0]?.id ?? null;
    const newLineKey = cartLineKey({
      product_id: product.id,
      variant_id: variantId,
      unit_id: unitId,
      selected_options: selectedOptions && selectedOptions.length > 0 ? selectedOptions : undefined,
    });

    const existing = current.find((line) => cartLineKey(line) === newLineKey);
    if (existing) {
      set({ cart: current.map((line) => (cartLineKey(line) === newLineKey ? { ...line, quantity: line.quantity + 1 } : line)) });
      return;
    }

    set({
      cart: [
        ...current,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: priceOf(product, variantId),
          discount: 0,
          unit_id: unitId,
          variant_id: variantId,
          variant_name: variant?.name ?? null,
          selected_options: selectedOptions && selectedOptions.length > 0 ? selectedOptions : undefined,
        },
      ],
    });
  },

  updateQuantity: (lineKey, delta) => {
    set((state) => ({
      cart: state.cart
        .map((line) => (cartLineKey(line) === lineKey ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line))
        .filter((line) => line.quantity > 0),
    }));
  },

  removeLine: (lineKey) => set((state) => ({ cart: state.cart.filter((line) => cartLineKey(line) !== lineKey) })),
  clearCart: () => set({ cart: [], selectedCustomer: null, appliedCoupon: null }),
  setCustomer: (customer) => set({ selectedCustomer: customer }),
  setWalletBalance: (balance) => set({ walletBalance: balance }),
  setPointsBalance: (points) => set({ pointsBalance: points }),
  setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),

  restoreCartFromHold: (lines, customer, manualDiscount, appliedCoupon) => {
    set({ cart: lines, selectedCustomer: customer, appliedCoupon });
  },

  submitSale: async (paymentType, paid, notes, splitLines, couponData, manualDiscount = 0, extras) => {
    const cart = get().cart;
    const branchId = useBranchStore.getState().activeBranch?.id;
    if (!branchId) return { ok: false, message: 'يجب اختيار فرع قبل إتمام البيع' };
    if (cart.length === 0) return { ok: false, message: 'السلة فارغة' };

    const settings = get().catalogSettings;
    const orderType: PosOrderType = extras?.orderType ?? 'takeaway';
    const allowDiscount = posAllowsDiscount(settings);
    const allowCoupon = posAllowsCoupon(settings);
    const safeManualDiscount = allowDiscount ? Math.max(0, Number(manualDiscount) || 0) : 0;
    const couponDisc = allowCoupon ? (couponData?.coupon_discount ?? 0) : 0;
    const loyaltyPoints = Math.max(0, Math.floor(extras?.loyaltyPointsRedeemed ?? 0));
    const loyaltyDiscountInput = Math.max(0, extras?.loyaltyDiscount ?? 0);

    const checkout = computePosCheckoutTotals({
      lines: cart,
      products: get().products,
      promotions: get().promotions,
      settings,
      branchId,
      manualDiscount: safeManualDiscount,
      couponDiscount: couponDisc,
      loyaltyDiscount: loyaltyDiscountInput,
      orderType,
      deliveryFee: extras?.deliveryFee ?? 0,
    });

    const layawayFinalTotal =
      paymentType === 'layaway' && extras?.layawayTerms
        ? Math.round(extras.layawayTerms.base_total * (1 + extras.layawayTerms.markup_percent / 100) * 100) / 100
        : checkout.total;
    const saleTotal = paymentType === 'layaway' ? layawayFinalTotal : checkout.total;
    const salePaid =
      paymentType === 'layaway' && extras?.layawayTerms
        ? Math.min(Math.max(0, paid), layawayFinalTotal)
        : paymentType === 'credit'
          ? paid
          : Math.min(paid, checkout.total);

    if (!useNetworkStore.getState().isOnline && (loyaltyPoints > 0 || extras?.giftCard)) {
      return {
        ok: false,
        message: loyaltyPoints > 0
          ? 'استبدال النقاط يحتاج اتصالاً بالخادم للتحقق من الرصيد.'
          : 'الدفع ببطاقة الهدايا يحتاج اتصالاً بالخادم للتحقق من الرصيد.',
      };
    }
    if (!useNetworkStore.getState().isOnline && extras?.diningTableId) {
      return { ok: false, message: 'طلب الطاولة يحتاج اتصالاً بالخادم لحفظ حالة الطاولة ومنع تكرار الطلب.' };
    }
    if (paymentType === 'layaway') {
      if (!get().selectedCustomer?.id) {
        return { ok: false, message: 'التقسيط يتطلب اختيار عميل' };
      }
      if (!extras?.layawayTerms) {
        return { ok: false, message: 'أكمل شروط التقسيط قبل إتمام البيع' };
      }
      if (!useNetworkStore.getState().isOnline) {
        return { ok: false, message: 'بيع التقسيط يحتاج اتصالاً بالخادم' };
      }
    }
    if (orderType === 'delivery') {
      if (!get().selectedCustomer?.id) {
        return { ok: false, message: 'التوصيل يتطلب اختيار عميل' };
      }
      if (!extras?.deliveryAddress?.trim()) {
        return { ok: false, message: 'عنوان التوصيل مطلوب' };
      }
    }

    const payload: SalePayload = {
      customer_id: get().selectedCustomer?.id ?? null,
      items: cart.map((line) => ({
        product_id: line.product_id,
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount: line.discount,
        unit_id: line.unit_id ?? null,
        variant_id: line.variant_id ?? null,
        selected_options: line.selected_options?.map((so) => ({
          product_option_group_id: so.product_option_group_id,
          option_ids: so.options.map((o) => o.product_option_id),
        })),
      })),
      subtotal: checkout.gross,
      tax: checkout.tax,
      discount: checkout.invoiceDiscount,
      promotion_discount: checkout.promotionDiscount,
      total: saleTotal,
      paid: salePaid,
      payment_type: paymentType,
      order_type: orderType,
      dining_table_id: extras?.diningTableId ?? null,
      notes,
      coupon_id: allowCoupon ? (couponData?.coupon_id ?? null) : null,
      coupon_discount: checkout.couponDiscount,
      loyalty_points_redeemed: loyaltyPoints > 0 ? loyaltyPoints : undefined,
      loyalty_discount: checkout.loyaltyDiscount > 0 ? checkout.loyaltyDiscount : undefined,
      delivery_fee: checkout.deliveryFee,
      delivery_address: orderType === 'delivery' ? extras?.deliveryAddress : undefined,
      delivery_phone: orderType === 'delivery' ? extras?.deliveryPhone : undefined,
      delivery_zone_id: orderType === 'delivery' ? (extras?.deliveryZoneId ?? null) : null,
      service_charge: checkout.serviceCharge,
      payment_lines: splitLines
        ? splitLines.filter((r) => (parseFloat(r.amount) || 0) > 0).map((r) => ({ vault_id: r.vault_id, amount: parseFloat(r.amount) || 0, payment_method: r.payment_method }))
        : null,
      layaway_terms: paymentType === 'layaway' ? (extras?.layawayTerms ?? null) : null,
    };
    if (!useNetworkStore.getState().isOnline) {
      try {
        const user = useAuthStore.getState().user;
        const branch = useBranchStore.getState().activeBranch;
        await saveOfflinePosOrder({
          payload,
          branchId,
          cashierId: user?.id ?? null,
          coupon: get().appliedCoupon?.coupon ?? null,
          couponDiscount: get().appliedCoupon?.discount,
          cartLines: cart,
          products: get().products.map((p) => ({ id: p.id, name: p.name, category_id: p.category_id ?? null })),
          branchName: branch?.name,
          cashierName: user?.name,
        });
        await get().refreshPendingOrders();
        get().clearCart();
        return { ok: false, queued: true, message: OFFLINE_SAVE_MESSAGE };
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : 'تعذر حفظ الطلب محلياً' };
      }
    }
    try {
      const settleTable = extras?.settleTable;
      if (settleTable?.tableId && orderType === 'dine_in') {
        let activeOrderId = settleTable.orderId ?? null;
        if (!activeOrderId) {
          try {
            const activeRes = await diningAPI.getActiveOrder(settleTable.tableId);
            activeOrderId = (activeRes.data as { id?: number | string } | undefined)?.id ?? null;
          } catch {
            activeOrderId = null;
          }
        }
        if (!activeOrderId) {
          return { ok: false, message: 'تعذر حفظ طلب الطاولة على الخادم قبل التحصيل. حاول مرة أخرى.' };
        }
        const settleRes = await diningAPI.settleOrder(settleTable.tableId, {
          payment_type: payload.payment_type,
          paid: salePaid,
          payment_lines: payload.payment_lines,
          customer_id: payload.customer_id,
          loyalty_points_redeemed: loyaltyPoints > 0 ? loyaltyPoints : undefined,
          loyalty_discount: checkout.loyaltyDiscount > 0 ? checkout.loyaltyDiscount : undefined,
          discount: checkout.invoiceDiscount,
          promotion_discount: checkout.promotionDiscount,
          coupon_id: allowCoupon ? (couponData?.coupon_id ?? null) : null,
          coupon_discount: checkout.couponDiscount,
          notes: payload.notes ?? undefined,
          layaway_terms: paymentType === 'layaway' ? (extras?.layawayTerms ?? null) : null,
        });
        if (settleRes.status === 'success') {
          const saleId = Number((settleRes.data as { id?: number })?.id) || undefined;
          if (extras?.giftCard && saleId && extras.giftCard.amount > 0) {
            try {
              await giftCardsAPI.redeem(String(extras.giftCard.id), {
                amount: extras.giftCard.amount,
                sale_id: saleId,
                customer_id: get().selectedCustomer?.id ?? undefined,
              });
            } catch (err) {
              return {
                ok: false,
                message:
                  err instanceof Error
                    ? `تم تحصيل الطاولة #${saleId} لكن فشل خصم بطاقة الهدايا: ${err.message}`
                    : `تم تحصيل الطاولة #${saleId} لكن فشل خصم بطاقة الهدايا`,
                saleId,
              };
            }
          }
          get().clearCart();
          void syncAll();
          return { ok: true, message: settleRes.message || 'تم تحصيل طلب الطاولة بنجاح', saleId };
        }
        return { ok: false, message: settleRes.message || 'تعذر تحصيل طلب الطاولة' };
      }

      const response = await posAPI.createSale(payload);
      if (response.status === 'success') {
        const saleId = Number((response.data as { id?: number })?.id) || undefined;
        if (extras?.giftCard && saleId && extras.giftCard.amount > 0) {
          try {
            await giftCardsAPI.redeem(String(extras.giftCard.id), {
              amount: extras.giftCard.amount,
              sale_id: saleId,
              customer_id: get().selectedCustomer?.id ?? undefined,
            });
          } catch (err) {
            return {
              ok: false,
              message:
                err instanceof Error
                  ? `تم إنشاء البيع #${saleId} لكن فشل خصم بطاقة الهدايا: ${err.message}`
                  : `تم إنشاء البيع #${saleId} لكن فشل خصم بطاقة الهدايا`,
              saleId,
            };
          }
        }
        get().clearCart();
        void syncAll();
        return { ok: true, message: response.message || 'تمت عملية البيع بنجاح', saleId };
      }
      return { ok: false, message: response.message || 'لا يمكن تنفيذ هذه العملية حالياً' };
    } catch (error) {
      return { ok: false, message: normalizeApiError(error).message };
    }
  },

  refreshPendingOrders: async () => {
    const pendingOrders = await getPendingOrders();
    set({ pendingOrders });
  },

  resetSession: () =>
    set({
      products: [],
      categories: [],
      customers: [],
      coupons: [],
      promotions: [],
      deliveryZones: [],
      cart: [],
      selectedCustomer: null,
      loading: false,
      error: null,
      lastSyncedAt: null,
      pendingOrders: [],
      walletBalance: null,
      pointsBalance: null,
      appliedCoupon: null,
      catalogSettings: {},
    }),
}));
