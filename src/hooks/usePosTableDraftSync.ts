import { diningAPI } from '@/api/dining';
import type { Coupon } from '@/types/api';
import type { CartLine } from '@/store/posStore';
import {
  buildTableOrderDraftPayload,
  cartContextFromSale,
  saleMetaFromServer,
  type PosDiningTableSelection,
} from '@/utils/posDining';
import {
  getTableOrderConflictSale,
  isTableOrderConflictError,
  normalizeApiError,
} from '@/utils/errors';

type CheckoutTotalsSlice = {
  gross: number;
  tax: number;
  invoiceDiscount: number;
  promotionDiscount: number;
  couponDiscount: number;
  total: number;
};

export type SyncTableDraftParams = {
  table: PosDiningTableSelection;
  cart: CartLine[];
  checkoutTotals: CheckoutTotalsSlice;
  effectiveTotal: number;
  selectedCustomerId?: number | null;
  notes: string;
  allowCoupons: boolean;
  allowManualDiscount: boolean;
  appliedCoupon: { coupon: Coupon; discount: number } | null;
  updateTableMeta: (patch: Partial<PosDiningTableSelection>) => void;
  restoreCartContext: (snapshot: {
    lines: CartLine[];
    cartDiscount: number;
    customer: import('@/types/api').Customer | null;
    appliedCoupon: { coupon: Coupon; discount: number } | null;
  }) => void;
};

export type SyncTableDraftResult = { ok: true } | { ok: false; message: string };

/** Explicit draft sync before checkout/settle — mirrors front syncCurrentTableReservations. */
export async function syncPosTableDraftBeforeCheckout(
  params: SyncTableDraftParams,
): Promise<SyncTableDraftResult> {
  const { table } = params;
  if (!table.id) return { ok: true };
  if (params.cart.length === 0 && !table.activeOrderId) return { ok: true };

  const payload = buildTableOrderDraftPayload({
    cart: params.cart,
    table,
    subtotal: params.checkoutTotals.gross,
    tax: params.checkoutTotals.tax,
    invoiceDiscount: params.checkoutTotals.invoiceDiscount,
    promotionDiscount: params.checkoutTotals.promotionDiscount,
    couponId: params.allowCoupons ? params.appliedCoupon?.coupon?.id ?? null : null,
    couponDiscount: params.checkoutTotals.couponDiscount,
    total: params.effectiveTotal,
    customerId: params.selectedCustomerId ?? null,
    notes: params.notes.trim() || null,
    allowDiscount: params.allowManualDiscount,
  });

  try {
    const response = await diningAPI.syncOrderDraft(table.id, payload);
    const data = response.data as Record<string, unknown> | undefined;
    if (data) {
      params.updateTableMeta({
        activeOrderId: data.id as number | string | null,
        ...saleMetaFromServer(data),
      });
    }
    return { ok: true };
  } catch (err) {
    if (isTableOrderConflictError(err)) {
      const sale = getTableOrderConflictSale(err);
      if (sale) {
        params.restoreCartContext(cartContextFromSale(sale));
        params.updateTableMeta({
          activeOrderId: sale.id as number | string | null,
          ...saleMetaFromServer(sale),
        });
        const retryPayload = {
          ...payload,
          expected_sale_updated_at:
            typeof sale.updated_at === 'string' ? sale.updated_at : table.saleUpdatedAt ?? null,
        };
        try {
          const retry = await diningAPI.syncOrderDraft(table.id, retryPayload);
          const retryData = retry.data as Record<string, unknown> | undefined;
          if (retryData) {
            params.updateTableMeta({
              activeOrderId: retryData.id as number | string | null,
              ...saleMetaFromServer(retryData),
            });
          }
          return { ok: true };
        } catch (retryErr) {
          return { ok: false, message: normalizeApiError(retryErr).message };
        }
      }
    }
    return { ok: false, message: normalizeApiError(err).message };
  }
}

/** Fallback when activeOrderId missing before settle — mirrors front getActiveOrder. */
export async function resolveActiveTableOrderId(tableId: string): Promise<number | string | null> {
  try {
    const response = await diningAPI.getActiveOrder(tableId);
    const data = response.data as Record<string, unknown> | undefined;
    return data?.id != null ? (data.id as number | string) : null;
  } catch {
    return null;
  }
}
