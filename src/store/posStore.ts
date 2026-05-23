import { create } from 'zustand';
import type { CartLineSelectedOption, Coupon, Customer, Product, SalePayload } from '@/types/api';
import { giftCardsAPI } from '@/api/giftCards';
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
  categories: { id: number; name: string }[];
  customers: Customer[];
  coupons: Coupon[];
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
};

export type SubmitSaleExtras = {
  loyaltyPointsRedeemed?: number;
  loyaltyDiscount?: number;
  giftCard?: { id: number; code: string; amount: number };
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
            catalogSettings: (catalog.settings ?? {}) as Record<string, unknown>,
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
          catalogSettings: (cached.catalog.settings ?? {}) as Record<string, unknown>,
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
          catalogSettings: (cached.catalog.settings ?? {}) as Record<string, unknown>,
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
    const amount = cartTotals(cart);
    const safeManualDiscount = Math.min(Math.max(Number(manualDiscount) || 0, 0), amount.total);
    const totalAfterManualDiscount = Math.max(0, amount.total - safeManualDiscount);
    const loyaltyPoints = Math.max(0, Math.floor(extras?.loyaltyPointsRedeemed ?? 0));
    const couponDisc = couponData?.coupon_discount ?? 0;
    const totalBeforeLoyalty = Math.max(0, totalAfterManualDiscount - couponDisc);
    const loyaltyDiscount = Math.min(
      Math.max(0, extras?.loyaltyDiscount ?? 0),
      totalBeforeLoyalty,
    );
    const payableTotal = Math.max(0, totalBeforeLoyalty - loyaltyDiscount);
    if (!useNetworkStore.getState().isOnline && (loyaltyPoints > 0 || extras?.giftCard)) {
      return {
        ok: false,
        message: loyaltyPoints > 0
          ? 'استبدال النقاط يحتاج اتصالاً بالخادم للتحقق من الرصيد.'
          : 'الدفع ببطاقة الهدايا يحتاج اتصالاً بالخادم للتحقق من الرصيد.',
      };
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
      subtotal: amount.subtotal,
      discount: amount.discount + safeManualDiscount,
      total: payableTotal,
      paid: paymentType === 'credit' ? paid : Math.min(paid, payableTotal),
      payment_type: paymentType,
      order_type: 'takeaway',
      notes,
      coupon_id: couponData?.coupon_id ?? null,
      coupon_discount: couponData?.coupon_discount ?? 0,
      loyalty_points_redeemed: loyaltyPoints > 0 ? loyaltyPoints : undefined,
      loyalty_discount: loyaltyDiscount > 0 ? loyaltyDiscount : undefined,
      payment_lines: splitLines
        ? splitLines.filter((r) => (parseFloat(r.amount) || 0) > 0).map((r) => ({ vault_id: r.vault_id, amount: parseFloat(r.amount) || 0, payment_method: r.payment_method }))
        : null,
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
}));
