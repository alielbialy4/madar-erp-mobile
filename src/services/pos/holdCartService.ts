import { posAPI } from '@/api/pos';
import type { Coupon, Customer } from '@/types/api';
import type { CartLine } from '@/store/posStore';
import { cartTotals } from '@/store/posStore';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore } from '@/store/networkStore';
import { normalizeApiError } from '@/utils/errors';
import { extractArray, extractData } from '@/utils/data';
import {
  deleteLocalHeldCart,
  getLocalHeldCarts,
  saveLocalHeldCart,
  type HeldCartLocalRecord,
} from './heldCartsLocal';

export type HeldCartListItem = {
  id: string;
  source: 'server' | 'local';
  name: string;
  total: number;
  paid: number;
  items_count: number;
  customer_name?: string | null;
  created_at: string;
  server_id?: number;
};

export type HoldCartSaveInput = {
  name?: string;
  notes?: string;
  cart: CartLine[];
  customer: Customer | null;
  manualDiscount: number;
  appliedCoupon: { coupon: Coupon; discount: number } | null;
  paidAdvance?: number;
};

function buildCartItemsPayload(cart: CartLine[]) {
  const totals = cartTotals(cart);
  return cart.map((line) => {
    const optionsExtra = line.selected_options?.length
      ? { selected_options: line.selected_options, notes: line.notes ?? null }
      : { notes: line.notes ?? null };
    const lineSub =
      line.quantity * line.unit_price +
      (line.selected_options?.reduce((s, g) => {
        if (g.pricing_type === 'group_price') return s + Number(g.group_price ?? 0);
        return s + g.options.reduce((o, opt) => o + Number(opt.option_price ?? 0), 0);
      }, 0) ?? 0);
    return {
      product_id: line.product_id,
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount: line.discount ?? 0,
      subtotal: Math.max(0, lineSub - (line.discount ?? 0)),
      unit_id: line.unit_id ?? null,
      variant_id: line.variant_id ?? null,
      variant_name: line.variant_name ?? null,
      ...optionsExtra,
    };
  });
}

export async function listHeldCarts(): Promise<HeldCartListItem[]> {
  const branchId = useBranchStore.getState().activeBranch?.id;
  const local = await getLocalHeldCarts(branchId);
  const localItems: HeldCartListItem[] = local.map((c) => ({
    id: `local:${c.local_id}`,
    source: 'local',
    name: c.name,
    total: c.total,
    paid: c.paid,
    items_count: c.cart_lines.length,
    customer_name: c.customer_name ?? null,
    created_at: c.created_at,
  }));

  if (!useNetworkStore.getState().isOnline) {
    return localItems.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  try {
    const res = await posAPI.getHoldCarts();
    const rows = extractArray<Record<string, unknown>>(res);
    const serverItems: HeldCartListItem[] = rows.map((row) => ({
      id: `server:${row.id}`,
      source: 'server',
      server_id: Number(row.id),
      name: String(row.name ?? 'سلة محفوظة'),
      total: Number(row.total ?? 0),
      paid: Number(row.paid ?? 0),
      items_count: Array.isArray(row.cart_items) ? row.cart_items.length : 0,
      customer_name: (row.customer as { name?: string } | null)?.name ?? null,
      created_at: String(row.created_at ?? ''),
    }));
    return [...serverItems, ...localItems].sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch {
    return localItems;
  }
}

export async function saveHeldCart(input: HoldCartSaveInput): Promise<{ ok: boolean; message: string }> {
  if (input.cart.length === 0) {
    return { ok: false, message: 'السلة فارغة' };
  }
  const branchId = useBranchStore.getState().activeBranch?.id;
  if (!branchId) return { ok: false, message: 'يجب اختيار فرع' };

  const amount = cartTotals(input.cart);
  const manual = Math.min(Math.max(input.manualDiscount, 0), amount.total);
  const couponDisc = input.appliedCoupon?.discount ?? 0;
  const invoiceDiscount = manual + couponDisc;
  const total = Math.max(0, amount.total - manual - couponDisc);
  const user = useAuthStore.getState().user;
  const name =
    input.name?.trim() ||
    `سلة ${new Date().toLocaleString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}`;

  const online = useNetworkStore.getState().isOnline;
  if (online) {
    try {
      await posAPI.holdCart({
        name,
        notes: input.notes ?? null,
        cart_items: buildCartItemsPayload(input.cart),
        customer_id: input.customer?.id ?? null,
        subtotal: amount.subtotal,
        tax: 0,
        discount: invoiceDiscount,
        cart_discount: manual,
        promotion_discount: 0,
        coupon_id: input.appliedCoupon?.coupon.id ?? null,
        coupon_discount: couponDisc,
        coupon_snapshot: input.appliedCoupon?.coupon ?? null,
        total,
        paid: input.paidAdvance ?? 0,
        payment_type: 'cash',
      });
      return { ok: true, message: 'تم حفظ السلة على الخادم' };
    } catch (err) {
      return { ok: false, message: normalizeApiError(err).message };
    }
  }

  await saveLocalHeldCart({
    name,
    notes: input.notes ?? null,
    branch_id: branchId,
    user_id: user?.id ?? null,
    customer_id: input.customer?.id ?? null,
    customer_name: input.customer?.name ?? null,
    cart_lines: input.cart,
    subtotal: amount.subtotal,
    tax: 0,
    discount: invoiceDiscount,
    cart_discount: manual,
    coupon_id: input.appliedCoupon?.coupon.id ?? null,
    coupon_discount: couponDisc,
    coupon_snapshot: input.appliedCoupon?.coupon ?? null,
    total,
    paid: input.paidAdvance ?? 0,
  });
  return {
    ok: true,
    message: 'تم حفظ السلة محلياً (بدون اتصال). ستُزامَن عند العودة للشبكة إذا أعدت الحفظ عبر الخادم.',
  };
}

export type RestoredHoldCart = {
  lines: CartLine[];
  customer: Customer | null;
  manualDiscount: number;
  appliedCoupon: { coupon: Coupon; discount: number } | null;
};

export async function restoreHeldCart(item: HeldCartListItem): Promise<RestoredHoldCart> {
  if (item.source === 'local') {
    const localId = item.id.replace('local:', '');
    const all = await getLocalHeldCarts();
    const found = all.find((c) => c.local_id === localId);
    if (!found) throw new Error('السلة المحلية غير موجودة');
    const customer: Customer | null = found.customer_id
      ? { id: found.customer_id, name: found.customer_name ?? 'عميل' }
      : null;
    const coupon =
      found.coupon_snapshot && found.coupon_discount > 0
        ? { coupon: found.coupon_snapshot, discount: found.coupon_discount }
        : null;
    return {
      lines: found.cart_lines.map((l) => ({ ...l })),
      customer,
      manualDiscount: found.cart_discount,
      appliedCoupon: coupon,
    };
  }

  const serverId = item.server_id ?? Number(item.id.replace('server:', ''));
  const response = await posAPI.restoreCart(serverId);
  const cartData = extractData<Record<string, unknown>>(response);
  if (!cartData) throw new Error('تعذر استعادة السلة');

  const rawItems = Array.isArray(cartData.cart_items) ? cartData.cart_items : [];
  const lines: CartLine[] = rawItems.map((item: Record<string, unknown>) => ({
    product_id: Number(item.product_id),
    product_name: String(item.product_name ?? `منتج #${item.product_id}`),
    quantity: Number(item.quantity) || 1,
    unit_price: Number(item.unit_price) || 0,
    discount: Number(item.discount) || 0,
    unit_id: item.unit_id != null ? Number(item.unit_id) : null,
    variant_id: item.variant_id != null ? String(item.variant_id) : null,
    variant_name: item.variant_name != null ? String(item.variant_name) : null,
    notes: item.notes != null ? String(item.notes) : undefined,
    selected_options: item.selected_options as CartLine['selected_options'],
  }));

  const meta = (cartData.hold_meta ?? {}) as Record<string, unknown>;
  const manualDisc =
    meta.cart_discount != null ? Number(meta.cart_discount) : Number(cartData.discount) || 0;
  const heldCoupon =
    meta.coupon_snapshot && meta.coupon_discount
      ? {
          coupon: meta.coupon_snapshot as Coupon,
          discount: Number(meta.coupon_discount),
        }
      : null;
  const custRaw = cartData.customer as { id?: number; name?: string } | null;
  const customer: Customer | null = custRaw?.id
    ? { id: Number(custRaw.id), name: String(custRaw.name ?? '') }
    : null;

  return { lines, customer, manualDiscount: manualDisc, appliedCoupon: heldCoupon };
}

export async function deleteHeldCart(item: HeldCartListItem): Promise<void> {
  if (item.source === 'local') {
    await deleteLocalHeldCart(item.id.replace('local:', ''));
    return;
  }
  const serverId = item.server_id ?? Number(item.id.replace('server:', ''));
  await posAPI.deleteHoldCart(serverId);
}
