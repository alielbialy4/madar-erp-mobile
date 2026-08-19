import { create } from 'zustand';
import type { CartLineSelectedOption, CatalogPromotion, Category, Coupon, Customer, DeliveryZone, FinancialAccount, LayawayTerms, Product, SalePayload } from '@/types/api';
import { cartLineKey, type CartLine } from '@/utils/cartLine';
import { cartLineGross, lineUnitPriceWithOptions } from '@/utils/cartPricing';
import { computePosCheckoutTotals, posAllowsCoupon, posAllowsDiscount, resolvePosCatalogSettings, type PosOrderType } from '@/utils/posTotals';
import { unitMeta, unitSellingPrice } from '@/utils/posUnitPrice';
import { giftCardsAPI } from '@/api/giftCards';
import { diningAPI } from '@/api/dining';
import { pullFullPosCatalog } from '@/api/sync';
import { posAPI } from '@/api/pos';
import { createUuid } from '@/utils/uuid';
import { loadPosCatalog, savePosCatalog } from '@/services/offline/catalogCache';
import { getPendingOrders } from '@/services/offline/posOrders';
import type { OfflinePosOrderRecord } from '@/types/offline';
import { saveOfflinePosOrder, OFFLINE_SAVE_MESSAGE } from '@/services/offline/offlineCheckout';
import { getPaymentPrintLabel } from '@/constants/printLabels';
import { runPostCheckoutPrint } from '@/services/pos/posCheckoutPrint';
import type { PostCheckoutPrintResult } from '@/services/pos/posCheckoutPrint';
import { prewarmReceiptLogoFromSettings } from '@/services/printing/printLogoCache';
import { normalizeApiError } from '@/utils/errors';
import { useAuthStore } from './authStore';
import { useBranchStore } from './branchStore';
import { useNetworkStore } from './networkStore';
import { buildCanonicalPaymentLine, buildCanonicalSplitPaymentLines, type PosCashTargetContext } from '@/utils/paymentAccounts';
import { createBranchScopeRequestGuard } from '@/utils/branchScopeRequest';

function triggerBackgroundSync() {
  void import('@/services/sync/syncEngine').then(({ syncAll }) => {
    void syncAll();
  });
}

export type { CartLine } from '@/utils/cartLine';
export { cartLineKey } from '@/utils/cartLine';

const catalogScopeRequests = createBranchScopeRequestGuard();

type SplitLine = {
  financial_account_id: string;
  vault_id?: string | null;
  amount: string;
  payment_method: 'cash' | 'card' | 'wallet' | 'electronic_wallet' | 'instapay' | 'bank_transfer' | 'payment_gateway';
};

type PosState = {
  products: Product[];
  categories: Pick<Category, 'id' | 'name' | 'image'>[];
  customers: Customer[];
  coupons: Coupon[];
  promotions: CatalogPromotion[];
  deliveryZones: DeliveryZone[];
  financialAccounts: FinancialAccount[];
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
  openShiftId: string | null;
  defaultWarehouseId: string | null;
  loadCatalog: () => Promise<void>;
  addProduct: (
    product: Product,
    selectedOptions?: CartLineSelectedOption[],
    variant?: { id: string; name?: string | null } | null,
    unitId?: number | null,
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
  ) => Promise<{
    ok: boolean;
    message: string;
    saleId?: number;
    queued?: boolean;
    printFeedback?: import('@/services/pos/posCheckoutPrint').PostCheckoutPrintResult;
  }>;
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
  /** Stable across a UI retry so a lost response cannot create a second sale. */
  clientUuid?: string;
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
  tableName?: string | null;
  shiftId?: string | null;
  posRegisterId?: string | null;
  registerSessionId?: string | null;
  /** Physical cash drawer vault linked to the active shift. */
  shiftVaultId?: string | null;
  cashTarget?: PosCashTargetContext;
  /** Canonical financial account selected for a non-split sale payment. */
  paymentAccountId?: string | null;
  warehouseId?: string | null;
  /** When set, settle an existing table order instead of creating a new sale. */
  settleTable?: { tableId: string; orderId?: number | string | null };
  /** Called when background post-checkout printing finishes. */
  onPrintComplete?: (result: PostCheckoutPrintResult) => void;
};

async function triggerPostCheckoutPrint(input: {
  branchId: string;
  saleId?: number;
  invoiceNumber?: string | null;
  printSequence?: number | string | null;
  cart: CartLine[];
  catalogSettings: Record<string, unknown>;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee?: number;
  total: number;
  paid: number;
  change?: number;
  balance?: number;
  paymentType: string;
  paymentBreakdown?: { label: string; amount: number }[];
  couponCode?: string | null;
  couponDiscount?: number;
  notes?: string | null;
  customerName?: string | null;
  orderType?: string | null;
  tableName?: string | null;
  products: Product[];
  categories?: { id: number; name: string }[];
}): Promise<PostCheckoutPrintResult | null> {
  const branch = useBranchStore.getState().activeBranch;
  const user = useAuthStore.getState().user;
  try {
    return await runPostCheckoutPrint({
      branchId: input.branchId,
      branchName: branch?.name,
      cashierName: user?.name,
      customerName: input.customerName,
      saleId: input.saleId,
      invoiceNumber: input.invoiceNumber,
      printSequence: input.printSequence,
      cartLines: input.cart,
      products: input.products.map((p) => ({ id: p.id, name: p.name, category_id: p.category_id ?? null })),
      categories: input.categories,
      catalogSettings: input.catalogSettings,
      orderType: input.orderType,
      tableName: input.tableName,
      receipt: {
        subtotal: input.subtotal,
        discount: input.discount,
        tax: input.tax,
        deliveryFee: input.deliveryFee,
        total: input.total,
        paid: input.paid,
        change: input.change,
        balance: input.balance,
        payment_type: input.paymentType,
        payment_breakdown: input.paymentBreakdown,
        coupon_code: input.couponCode,
        coupon_discount: input.couponDiscount,
        notes: input.notes,
      },
    });
  } catch {
    return null;
  }
}

function schedulePostCheckoutPrint(
  input: Parameters<typeof triggerPostCheckoutPrint>[0],
  onComplete?: (result: PostCheckoutPrintResult) => void,
): void {
  void triggerPostCheckoutPrint(input).then((result) => {
    if (result && onComplete) onComplete(result);
  });
}

function resolveDefaultWarehouseId(catalog: import('@/types/api').PosCatalog): string | null {
  const settings = catalog.settings as Record<string, unknown> | undefined;
  if (settings?.default_warehouse_id != null && String(settings.default_warehouse_id).trim() !== '') {
    return String(settings.default_warehouse_id);
  }
  const first = catalog.warehouses?.[0]?.id;
  return first != null ? String(first) : null;
}

function applyCatalogToState(catalog: import('@/types/api').PosCatalog, lastSyncedAt: string) {
  return {
    products: catalog.products ?? [],
    categories: catalog.categories ?? [],
    customers: catalog.customers ?? [],
    coupons: catalog.coupons ?? [],
    promotions: (catalog.promotions ?? []) as CatalogPromotion[],
    deliveryZones: catalog.delivery_zones ?? [],
    financialAccounts: catalog.financial_accounts ?? [],
    catalogSettings: resolvePosCatalogSettings(catalog),
    openShiftId: catalog.open_shift?.id ? String(catalog.open_shift.id) : null,
    defaultWarehouseId: resolveDefaultWarehouseId(catalog),
    lastSyncedAt,
    loading: false,
    error: null,
  };
}

export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, line) => sum + cartLineGross(line), 0);
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
  financialAccounts: [],
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
  openShiftId: null,
  defaultWarehouseId: null,

  loadCatalog: async () => {
    set({ loading: true, error: null });
    const branchId = useBranchStore.getState().activeBranch?.id;
    const request = catalogScopeRequests.begin(branchId);
    const isCurrentScope = () => catalogScopeRequests.isCurrent(
      request,
      useBranchStore.getState().activeBranch?.id,
    );
    const online = useNetworkStore.getState().isOnline;
    try {
      if (online && branchId) {
        const response = await pullFullPosCatalog(branchId);
        const catalog = response.data;
        if (catalog && response.status === 'success') {
          if (!isCurrentScope()) return;
          await savePosCatalog(catalog, branchId);
          if (!isCurrentScope()) return;
          const nextState = applyCatalogToState(catalog, catalog.generated_at ?? new Date().toISOString());
          set(nextState);
          void prewarmReceiptLogoFromSettings(nextState.catalogSettings);
          await get().refreshPendingOrders();
          return;
        }
      }
      const cached = await loadPosCatalog();
      if (!isCurrentScope()) return;
      if (cached?.catalog && (!branchId || !cached.branch_id || cached.branch_id === branchId)) {
        const nextState = applyCatalogToState(cached.catalog, cached.saved_at);
        set(nextState);
        void prewarmReceiptLogoFromSettings(nextState.catalogSettings);
      } else if (cached?.catalog && branchId && cached.branch_id && cached.branch_id !== branchId) {
        set({
          loading: false,
          error: 'الكتالوج المخزّن لفرع آخر. اتصل بالشبكة لتحميل فرعك الحالي.',
        });
      } else {
        set({ loading: false, error: branchId ? 'لا توجد بيانات مخزنة لنقطة البيع' : 'اختر فرعاً أولاً' });
      }
      await get().refreshPendingOrders();
    } catch (error) {
      const cached = await loadPosCatalog();
      if (!isCurrentScope()) return;
      if (cached?.catalog && (!branchId || !cached.branch_id || cached.branch_id === branchId)) {
        const nextState = applyCatalogToState(cached.catalog, cached.saved_at);
        set(nextState);
        void prewarmReceiptLogoFromSettings(nextState.catalogSettings);
      } else {
        set({ loading: false, error: normalizeApiError(error).message });
      }
      await get().refreshPendingOrders();
    }
  },

  addProduct: (product, selectedOptions, variant, unitId) => {
    const current = get().cart;
    const variantId = variant?.id ?? null;
    const uMeta = unitMeta(product, unitId);
    const resolvedUnitId = uMeta?.id ?? null;
    const newLineKey = cartLineKey({
      product_id: product.id,
      variant_id: variantId,
      unit_id: resolvedUnitId,
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
          unit_price: unitSellingPrice(product, variantId, resolvedUnitId),
          discount: 0,
          unit_id: resolvedUnitId,
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

    const clientUuid = extras?.clientUuid ?? createUuid();
    const shiftId = extras?.shiftId ?? get().openShiftId;
    const warehouseId = extras?.warehouseId ?? get().defaultWarehouseId;
    const { getSelectedPosRegisterId, getActiveRegisterSessionId } = await import(
      '@/services/storage/registerSessionContext'
    );
    const posRegisterId = extras?.posRegisterId ?? (await getSelectedPosRegisterId());
    const registerSessionId = extras?.registerSessionId ?? (await getActiveRegisterSessionId());

    const payload: SalePayload = {
      client_uuid: clientUuid,
      shift_id: shiftId,
      pos_register_id: posRegisterId,
      register_session_id: registerSessionId,
      warehouse_id: warehouseId,
      customer_id: get().selectedCustomer?.id ?? null,
      items: cart.map((line) => ({
        product_id: line.product_id,
        quantity: line.quantity,
        unit_price: lineUnitPriceWithOptions(line),
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
        ? buildCanonicalSplitPaymentLines(
          splitLines,
          get().financialAccounts,
          extras?.cashTarget ?? extras?.shiftVaultId,
        )
        : (() => {
            const line = buildCanonicalPaymentLine({
              accounts: get().financialAccounts,
              paymentMethod: paymentType,
              accountId: extras?.paymentAccountId,
              amount: salePaid,
              shiftVaultId: extras?.shiftVaultId,
              cashTarget: extras?.cashTarget,
            });
            return line ? [line] : null;
          })(),
      layaway_terms: paymentType === 'layaway' ? (extras?.layawayTerms ?? null) : null,
    };
    if (!useNetworkStore.getState().isOnline) {
      try {
        const user = useAuthStore.getState().user;
        const branch = useBranchStore.getState().activeBranch;
        await saveOfflinePosOrder({
          payload,
          branchId,
          shiftId,
          cashierId: user?.id ?? null,
          coupon: get().appliedCoupon?.coupon ?? null,
          couponDiscount: get().appliedCoupon?.discount,
          cartLines: cart,
          products: get().products.map((p) => ({ id: p.id, name: p.name, category_id: p.category_id ?? null })),
          branchName: branch?.name,
          cashierName: user?.name,
          catalogSettings: get().catalogSettings,
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
          client_op_id: clientUuid,
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
          const saleData = (settleRes.data ?? {}) as import('@/types/api').Sale;
          const change = salePaid > saleTotal ? salePaid - saleTotal : 0;
          const balance = paymentType === 'credit' ? Math.max(0, saleTotal - salePaid) : 0;
          const printInput = {
            branchId,
            saleId,
            invoiceNumber: saleData.invoice_number ?? null,
            printSequence: saleData.print_sequence ?? null,
            cart,
            catalogSettings: get().catalogSettings,
            subtotal: checkout.gross,
            discount: checkout.invoiceDiscount,
            tax: checkout.tax,
            deliveryFee: checkout.deliveryFee,
            total: saleTotal,
            paid: salePaid,
            change,
            balance,
            paymentType,
            paymentBreakdown: splitLines
              ?.filter((r) => (parseFloat(r.amount) || 0) > 0)
              .map((r) => ({
                label: getPaymentPrintLabel(r.payment_method ?? 'cash'),
                amount: parseFloat(r.amount) || 0,
              })),
            couponCode: get().appliedCoupon?.coupon?.code ?? null,
            couponDiscount: checkout.couponDiscount,
            notes: notes ?? null,
            customerName: get().selectedCustomer?.name ?? null,
            orderType: orderType,
            tableName: extras?.tableName ?? null,
            products: get().products,
            categories: get().categories.map((c) => ({ id: c.id, name: c.name })),
          };
          get().clearCart();
          schedulePostCheckoutPrint(printInput, extras?.onPrintComplete);
          void triggerBackgroundSync();
          return {
            ok: true,
            message: settleRes.message || 'تم تحصيل طلب الطاولة بنجاح',
            saleId,
          };
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
        const saleData = (response.data ?? {}) as import('@/types/api').Sale;
        const change = salePaid > saleTotal ? salePaid - saleTotal : 0;
        const balance = paymentType === 'credit' ? Math.max(0, saleTotal - salePaid) : 0;
        const printInput = {
          branchId,
          saleId,
          invoiceNumber: saleData.invoice_number ?? null,
          printSequence: saleData.print_sequence ?? null,
          cart,
          catalogSettings: get().catalogSettings,
          subtotal: checkout.gross,
          discount: checkout.invoiceDiscount,
          tax: checkout.tax,
          deliveryFee: checkout.deliveryFee,
          total: saleTotal,
          paid: salePaid,
          change,
          balance,
          paymentType,
          paymentBreakdown: splitLines
            ?.filter((r) => (parseFloat(r.amount) || 0) > 0)
            .map((r) => ({
              label: getPaymentPrintLabel(r.payment_method ?? 'cash'),
              amount: parseFloat(r.amount) || 0,
            })),
          couponCode: get().appliedCoupon?.coupon?.code ?? null,
          couponDiscount: checkout.couponDiscount,
          notes: notes ?? null,
          customerName: get().selectedCustomer?.name ?? null,
          orderType: orderType,
          tableName: extras?.tableName ?? null,
          products: get().products,
          categories: get().categories.map((c) => ({ id: c.id, name: c.name })),
        };
        get().clearCart();
        schedulePostCheckoutPrint(printInput, extras?.onPrintComplete);
        void triggerBackgroundSync();
        return {
          ok: true,
          message: response.message || 'تمت عملية البيع بنجاح',
          saleId,
        };
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

  resetSession: () => {
    catalogScopeRequests.invalidate();
    set({
      products: [],
      categories: [],
      customers: [],
      coupons: [],
      promotions: [],
      deliveryZones: [],
      financialAccounts: [],
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
      openShiftId: null,
      defaultWarehouseId: null,
    });
  },
}));
