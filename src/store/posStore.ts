import { create } from 'zustand';
import type { CartLineSelectedOption, Coupon, Customer, Product, SalePayload } from '@/types/api';
import { posAPI } from '@/api/pos';
import { loadPosCatalog, savePosCatalog } from '@/services/offline/catalogCache';
import { addPendingOrder, getPendingOrders, PendingOfflineOrder } from '@/services/offline/posOrders';
import { normalizeApiError } from '@/utils/errors';
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
  pendingOrders: PendingOfflineOrder[];
  walletBalance: number | null;
  pointsBalance: number | null;
  appliedCoupon: { coupon: Coupon; discount: number } | null;
  loadCatalog: () => Promise<void>;
  addProduct: (product: Product, selectedOptions?: CartLineSelectedOption[]) => void;
  updateQuantity: (productId: number, delta: number) => void;
  removeLine: (productId: number) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  submitSale: (paymentType: SalePayload['payment_type'], paid: number, notes?: string, splitLines?: SplitLine[], couponData?: { coupon_id: string | null; coupon_discount: number }, manualDiscount?: number) => Promise<{ ok: boolean; message: string; saleId?: number; queued?: boolean }>;
  refreshPendingOrders: () => Promise<void>;
  setWalletBalance: (balance: number | null) => void;
  setPointsBalance: (points: number | null) => void;
  setAppliedCoupon: (coupon: { coupon: Coupon; discount: number } | null) => void;
};

function priceOf(product: Product): number {
  const value = Number(product.selling_price ?? 0);
  return Number.isFinite(value) ? value : 0;
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

  loadCatalog: async () => {
    set({ loading: true, error: null });
    const branchId = useBranchStore.getState().activeBranch?.id;
    const online = useNetworkStore.getState().isOnline;
    try {
      if (online && branchId) {
        const response = await posAPI.pullCatalog(branchId);
        const catalog = response.data;
        if (catalog) {
          await savePosCatalog(catalog);
          set({
            products: catalog.products ?? [],
            categories: catalog.categories ?? [],
            customers: catalog.customers ?? [],
            coupons: catalog.coupons ?? [],
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

  addProduct: (product, selectedOptions) => {
    const current = get().cart;

    if (!selectedOptions || selectedOptions.length === 0) {
      const existing = current.find((line) => line.product_id === product.id && !line.selected_options?.length);
      if (existing) {
        set({ cart: current.map((line) => line.product_id === product.id && !line.selected_options?.length ? { ...line, quantity: line.quantity + 1 } : line) });
        return;
      }
    }

    set({
      cart: [
        ...current,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: priceOf(product),
          discount: 0,
          unit_id: product.units?.find((unit) => unit.is_base)?.id ?? product.units?.[0]?.id ?? null,
          selected_options: selectedOptions && selectedOptions.length > 0 ? selectedOptions : undefined,
        },
      ],
    });
  },

  updateQuantity: (productId, delta) => {
    set((state) => ({
      cart: state.cart
        .map((line) => line.product_id === productId ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line)
        .filter((line) => line.quantity > 0),
    }));
  },

  removeLine: (productId) => set((state) => ({ cart: state.cart.filter((line) => line.product_id !== productId) })),
  clearCart: () => set({ cart: [], selectedCustomer: null, appliedCoupon: null }),
  setCustomer: (customer) => set({ selectedCustomer: customer }),
  setWalletBalance: (balance) => set({ walletBalance: balance }),
  setPointsBalance: (points) => set({ pointsBalance: points }),
  setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),

  submitSale: async (paymentType, paid, notes, splitLines, couponData, manualDiscount = 0) => {
    const cart = get().cart;
    const branchId = useBranchStore.getState().activeBranch?.id;
    if (!branchId) return { ok: false, message: 'يجب اختيار فرع قبل إتمام البيع' };
    if (cart.length === 0) return { ok: false, message: 'السلة فارغة' };
    const amount = cartTotals(cart);
    const safeManualDiscount = Math.min(Math.max(Number(manualDiscount) || 0, 0), amount.total);
    const totalAfterManualDiscount = Math.max(0, amount.total - safeManualDiscount);
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
      total: totalAfterManualDiscount,
      paid,
      payment_type: paymentType,
      order_type: 'takeaway',
      notes,
      coupon_id: couponData?.coupon_id ?? null,
      coupon_discount: couponData?.coupon_discount ?? 0,
      payment_lines: splitLines
        ? splitLines.filter((r) => (parseFloat(r.amount) || 0) > 0).map((r) => ({ vault_id: r.vault_id, amount: parseFloat(r.amount) || 0, payment_method: r.payment_method }))
        : null,
    };
    if (!useNetworkStore.getState().isOnline) {
      await addPendingOrder(payload, branchId);
      await get().refreshPendingOrders();
      get().clearCart();
      return { ok: false, queued: true, message: 'تم حفظ الطلب في قائمة الانتظار. لم يتم تأكيد البيع من الخادم بعد.' };
    }
    try {
      const response = await posAPI.createSale(payload);
      if (response.status === 'success') {
        get().clearCart();
        return { ok: true, message: response.message || 'تمت عملية البيع بنجاح', saleId: Number((response.data as any)?.id) || undefined };
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
