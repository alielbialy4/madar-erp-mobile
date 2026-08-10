import type { OfflinePosOrderRecord } from '@/types/offline';
import type { ReceiptPrintPayload } from '@/types/printing';
import { mapCheckoutToReceiptPayload } from '@/services/printing/receiptMappers';
import type { CartLine } from '@/store/posStore';

export function buildReceiptPayloadFromOrder(
  order: OfflinePosOrderRecord,
  meta: { branchName?: string; cashierName?: string },
  cartLines?: CartLine[],
  catalogSettings?: Record<string, unknown> | null,
): ReceiptPrintPayload {
  const lines =
    cartLines ??
    order.items.map((item) => ({
      product_id: item.product_id,
      product_name: `منتج #${item.product_id}`,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      discount: Number(item.discount ?? 0),
      variant_id: item.variant_id ?? null,
      variant_name: null,
    }));

  return mapCheckoutToReceiptPayload({
    branchName: meta.branchName,
    cashierName: meta.cashierName,
    cartLines: lines,
    products: lines.map((l) => ({ id: l.product_id, name: l.product_name, category_id: null })),
    catalogSettings: catalogSettings ?? {},
    subtotal: order.totals_snapshot.subtotal,
    discount: order.totals_snapshot.discount,
    tax: order.totals_snapshot.tax,
    total: order.totals_snapshot.total,
    paid: order.totals_snapshot.paid,
    paymentType: order.payload.payment_type,
    couponCode: order.coupon_snapshot?.coupon_id ? String(order.coupon_snapshot.coupon_id) : null,
    notes: order.payload.notes ?? null,
    isOffline: true,
    localOrderId: order.local_order_id,
  });
}
