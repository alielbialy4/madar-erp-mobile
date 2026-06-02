import type { Coupon, SalePayload } from '@/types/api';
import type { OfflinePosOrderRecord } from '@/types/offline';
import type { ReceiptPrintPayload } from '@/types/printing';
import { hasCachedCatalog } from '@/services/offline/catalogCache';
import { addPendingOrder } from '@/services/offline/posOrders';
import { getKitchenRoutingRules, resolveKitchenProfilesForCart } from '@/services/offline/kitchenRouting';
import { getEnabledProfilesByRole, getPrinterProfile } from '@/services/printing/printerProfiles';
import { printEngine } from '@/services/printing/printEngine';
import { useServerKitchenPrintQueue } from '@/services/pos/posKitchenPrint';
import type { CartLine } from '@/store/posStore';

export const OFFLINE_SAVE_MESSAGE =
  'تم حفظ الطلب محلياً وسيتم مزامنته عند عودة الاتصال';

export async function canCheckoutOffline(branchId: string): Promise<{ ok: boolean; message?: string }> {
  const hasCatalog = await hasCachedCatalog(branchId);
  if (!hasCatalog) {
    return { ok: false, message: 'لا يوجد كتالوج مخزّن. يجب تحميل الكتالوج مرة واحدة على الأقل أثناء الاتصال.' };
  }
  return { ok: true };
}

export function buildReceiptPayloadFromOrder(
  order: OfflinePosOrderRecord,
  meta: { branchName?: string; cashierName?: string },
  cartLines?: CartLine[],
): ReceiptPrintPayload {
  return {
    branch_name: meta.branchName,
    cashier_name: meta.cashierName,
    date: new Date(order.created_at).toLocaleString('ar-EG-u-nu-latn'),
    local_order_id: order.local_order_id,
    is_offline_unsynced: true,
    items: order.items.map((item) => {
      const line = cartLines?.find((l) => l.product_id === item.product_id && (l.variant_id ?? null) === (item.variant_id ?? null))
        ?? cartLines?.find((l) => l.product_id === item.product_id);
      return {
      name: line?.variant_name ? `${line.product_name} - ${line.variant_name}` : line?.product_name ?? `منتج #${item.product_id}`,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      discount: Number(item.discount ?? 0),
    };
    }),
    subtotal: order.totals_snapshot.subtotal,
    discount: order.totals_snapshot.discount,
    tax: order.totals_snapshot.tax,
    total: order.totals_snapshot.total,
    paid: order.totals_snapshot.paid,
    payment_type: order.payload.payment_type,
    coupon_label: order.coupon_snapshot?.coupon_id ? `كوبون ${order.coupon_snapshot.coupon_id}` : null,
    notes: order.payload.notes ?? null,
  };
}

export async function enqueueOfflinePrintJobs(
  order: OfflinePosOrderRecord,
  cartLines: CartLine[],
  products: { id: number; name: string; category_id?: number | null }[],
  meta: { branchName?: string; cashierName?: string; catalogSettings?: Record<string, unknown> | null },
): Promise<void> {
  const cashierProfiles = await getEnabledProfilesByRole('cashier');
  const receiptPayload = buildReceiptPayloadFromOrder(order, meta, cartLines);
  for (const profile of cashierProfiles) {
    try {
      await printEngine.printReceipt(receiptPayload, profile);
    } catch {
      /* queued via printEngine with failed status */
    }
  }

  if (!useServerKitchenPrintQueue(meta.catalogSettings)) {
  const rules = await getKitchenRoutingRules(order.branch_id);
  const groups = resolveKitchenProfilesForCart(cartLines, products, rules);
  for (const group of groups) {
    const profile = await getPrinterProfile(group.profileId);
    if (!profile?.enabled) continue;
    await printEngine.printKitchenTicket(
      {
        order_label: order.local_order_id,
        items: group.lines.map((l) => ({
          name: l.product_name,
          quantity: l.quantity,
          notes: l.notes,
          modifiers: l.selected_options?.flatMap((g) => g.options.map((o) => o.name ?? '')),
        })),
        ticket_type: group.ticketType === 'bar' ? 'bar' : 'kitchen',
      },
      profile,
    );
  }
  }
}

export async function saveOfflinePosOrder(input: {
  payload: SalePayload;
  branchId: string;
  shiftId?: string | null;
  cashierId?: number | null;
  coupon?: Coupon | null;
  couponDiscount?: number;
  cartLines: CartLine[];
  products: { id: number; name: string; category_id?: number | null }[];
  branchName?: string;
  cashierName?: string;
  catalogSettings?: Record<string, unknown> | null;
}): Promise<{ order: OfflinePosOrderRecord; message: string }> {
  const check = await canCheckoutOffline(input.branchId);
  if (!check.ok) throw new Error(check.message);

  const order = await addPendingOrder({
    payload: input.payload,
    branchId: input.branchId,
    shiftId: input.shiftId,
    cashierId: input.cashierId,
    coupon: input.coupon,
    couponDiscount: input.couponDiscount,
  });

  await enqueueOfflinePrintJobs(order, input.cartLines, input.products, {
    branchName: input.branchName,
    cashierName: input.cashierName,
    catalogSettings: input.catalogSettings,
  });

  return { order, message: OFFLINE_SAVE_MESSAGE };
}
