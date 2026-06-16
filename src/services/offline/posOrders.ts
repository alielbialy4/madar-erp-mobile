import type { Coupon, SalePayload } from '@/types/api';
import type {
  CouponSnapshot,
  LegacyPendingOfflineOrder,
  OfflineOrderSyncStatus,
  OfflinePosOrderRecord,
} from '@/types/offline';
import { storageGetArray, storageKeys, storageSet } from '@/services/storage';
import { createUuid } from '@/utils/uuid';

export type PendingOfflineOrder = OfflinePosOrderRecord;
export type { OfflinePosOrderRecord };

export type CreateOfflineOrderInput = {
  payload: SalePayload;
  branchId: string;
  shiftId?: string | null;
  cashierId?: number | null;
  coupon?: Coupon | null;
  couponDiscount?: number;
};

function isLegacyOrder(row: unknown): row is LegacyPendingOfflineOrder {
  return Boolean(row && typeof row === 'object' && 'client_uuid' in row && !('local_order_id' in row));
}

function migrateLegacy(row: LegacyPendingOfflineOrder): OfflinePosOrderRecord {
  const clientId = row.client_uuid;
  const created = row.created_at_local ?? new Date().toISOString();
  return {
    local_order_id: clientId,
    client_order_id: clientId,
    client_uuid: clientId,
    branch_id: row.branch_id,
    customer_id: row.customer_id ?? null,
    items: row.items,
    discounts: { manual: Number(row.discount ?? 0) },
    coupon_snapshot: row.coupon_id
      ? { coupon_id: row.coupon_id, coupon_discount: Number(row.coupon_discount ?? 0) }
      : null,
    payment_lines: row.payment_lines ?? null,
    totals_snapshot: {
      subtotal: Number(row.subtotal ?? 0),
      discount: Number(row.discount ?? 0),
      tax: Number(row.tax ?? 0),
      total: Number(row.total ?? 0),
      paid: Number(row.paid ?? 0),
    },
    payload: { ...row, sale_date: created },
    status: row.status === 'failed' ? 'failed' : 'pending',
    error_message: row.last_error ?? null,
    created_at: created,
  };
}

function isStoredOrderRow(row: unknown): row is LegacyPendingOfflineOrder | OfflinePosOrderRecord {
  return row != null && typeof row === 'object';
}

function normalizeRows(rows: unknown[]): OfflinePosOrderRecord[] {
  return rows
    .filter(isStoredOrderRow)
    .map((row) => (isLegacyOrder(row) ? migrateLegacy(row) : row));
}

async function readStoredOrderRows(): Promise<unknown[]> {
  return storageGetArray(storageKeys.posPendingOrders, isStoredOrderRow);
}

export async function getPendingOrders(): Promise<OfflinePosOrderRecord[]> {
  const raw = await readStoredOrderRows();
  if (!raw.length) return [];
  return normalizeRows(raw).filter((o) => o.status !== 'synced');
}

/** Orders eligible for push: pending, failed (retry), and stuck syncing from a prior crash. */
export async function getOrdersForSync(): Promise<OfflinePosOrderRecord[]> {
  const orders = await getPendingOrders();
  return orders.filter((o) => o.status === 'pending' || o.status === 'failed' || o.status === 'syncing');
}

/** Recover orders left in `syncing` after app kill or partial API response. */
export async function resetSyncingOrdersToPending(): Promise<number> {
  const orders = await getAllOfflineOrders();
  let count = 0;
  await persistOrders(
    orders.map((item) => {
      if (item.status !== 'syncing') return item;
      count += 1;
      return { ...item, status: 'pending' as OfflineOrderSyncStatus, error_message: item.error_message ?? null };
    }),
  );
  return count;
}

export async function markOrdersSyncing(clientOrderIds: string[]): Promise<void> {
  if (!clientOrderIds.length) return;
  const idSet = new Set(clientOrderIds);
  const orders = await getAllOfflineOrders();
  await persistOrders(
    orders.map((item) =>
      idSet.has(item.client_order_id)
        ? { ...item, status: 'syncing' as OfflineOrderSyncStatus, error_message: null }
        : item,
    ),
  );
}

export async function resetOrdersToPending(clientOrderIds: string[], message?: string): Promise<void> {
  if (!clientOrderIds.length) return;
  const idSet = new Set(clientOrderIds);
  const orders = await getAllOfflineOrders();
  await persistOrders(
    orders.map((item) =>
      idSet.has(item.client_order_id)
        ? {
            ...item,
            status: 'pending' as OfflineOrderSyncStatus,
            error_message: message ?? item.error_message ?? null,
          }
        : item,
    ),
  );
}

export async function getAllOfflineOrders(): Promise<OfflinePosOrderRecord[]> {
  const raw = await readStoredOrderRows();
  if (!raw.length) return [];
  return normalizeRows(raw);
}

async function persistOrders(orders: OfflinePosOrderRecord[]): Promise<void> {
  await storageSet(storageKeys.posPendingOrders, orders);
}

export async function addPendingOrder(input: CreateOfflineOrderInput): Promise<OfflinePosOrderRecord> {
  const orders = await getAllOfflineOrders();
  const clientId = createUuid();
  const createdAt = new Date().toISOString();
  const couponSnapshot: CouponSnapshot | null = input.coupon
    ? {
        coupon_id: String(input.coupon.id),
        coupon_code: input.coupon.code ?? null,
        coupon_discount: input.couponDiscount ?? 0,
      }
    : input.payload.coupon_id
      ? {
          coupon_id: input.payload.coupon_id,
          coupon_discount: Number(input.payload.coupon_discount ?? 0),
        }
      : null;

  const order: OfflinePosOrderRecord = {
    local_order_id: createUuid(),
    client_order_id: clientId,
    client_uuid: clientId,
    branch_id: input.branchId,
    shift_id: input.shiftId ?? null,
    cashier_id: input.cashierId ?? null,
    customer_id: input.payload.customer_id ?? null,
    items: input.payload.items,
    discounts: { manual: Number(input.payload.discount ?? 0) },
    coupon_snapshot: couponSnapshot,
    payment_lines: input.payload.payment_lines ?? null,
    totals_snapshot: {
      subtotal: Number(input.payload.subtotal ?? 0),
      discount: Number(input.payload.discount ?? 0),
      tax: Number(input.payload.tax ?? 0),
      total: Number(input.payload.total ?? 0),
      paid: Number(input.payload.paid ?? 0),
    },
    payload: { ...input.payload, sale_date: createdAt },
    status: 'pending',
    created_at: createdAt,
  };
  await persistOrders([...orders, order]);
  return order;
}

/** Backward-compatible helper for older call sites. */
export async function addPendingOrderLegacy(payload: SalePayload, branchId: string): Promise<OfflinePosOrderRecord> {
  return addPendingOrder({ payload, branchId });
}

export async function removePendingOrders(ids: Set<string>): Promise<void> {
  const orders = await getAllOfflineOrders();
  await persistOrders(orders.filter((item) => !ids.has(item.client_order_id) && !ids.has(item.local_order_id)));
}

export async function markOrderSyncing(clientOrderId: string): Promise<void> {
  const orders = await getAllOfflineOrders();
  await persistOrders(
    orders.map((item) =>
      item.client_order_id === clientOrderId ? { ...item, status: 'syncing' as OfflineOrderSyncStatus, error_message: null } : item,
    ),
  );
}

export async function markOrderSynced(
  clientOrderId: string,
  serverSaleId?: number,
  serverInvoiceNumber?: string | null,
): Promise<void> {
  const orders = await getAllOfflineOrders();
  const syncedAt = new Date().toISOString();
  await persistOrders(
    orders.map((item) =>
      item.client_order_id === clientOrderId
        ? {
            ...item,
            status: 'synced' as OfflineOrderSyncStatus,
            server_sale_id: serverSaleId ?? null,
            server_invoice_number: serverInvoiceNumber ?? null,
            synced_at: syncedAt,
            error_message: null,
          }
        : item,
    ),
  );
  const synced = new Set([clientOrderId]);
  await removePendingOrders(synced);
}

export async function failPendingOrder(clientOrderId: string, message: string): Promise<void> {
  const orders = await getAllOfflineOrders();
  await persistOrders(
    orders.map((item) =>
      item.client_order_id === clientOrderId
        ? { ...item, status: 'failed' as OfflineOrderSyncStatus, error_message: message }
        : item,
    ),
  );
}

export async function retryFailedOrders(ids?: Set<string>): Promise<number> {
  const orders = await getAllOfflineOrders();
  let count = 0;
  await persistOrders(
    orders.map((item) => {
      const shouldRetry = item.status === 'failed' && (!ids || ids.has(item.client_order_id));
      if (!shouldRetry) return item;
      count += 1;
      return { ...item, status: 'pending' as OfflineOrderSyncStatus, error_message: null };
    }),
  );
  return count;
}

export function countByStatus(orders: OfflinePosOrderRecord[]) {
  return {
    pending: orders.filter((o) => o.status === 'pending' || o.status === 'syncing').length,
    failed: orders.filter((o) => o.status === 'failed').length,
    syncing: orders.filter((o) => o.status === 'syncing').length,
  };
}

/** Payload shape expected by `/sync/offline-orders`. */
export function toApiOfflineOrder(
  order: OfflinePosOrderRecord,
  shiftIdFallback?: string | null,
): LegacyPendingOfflineOrder & { sale_date: string } {
  const payload = order.payload ?? ({} as SalePayload);
  const resolvedShiftId =
    order.shift_id ??
    payload.shift_id ??
    (shiftIdFallback != null && String(shiftIdFallback).trim() !== '' ? String(shiftIdFallback) : undefined);

  return {
    ...payload,
    client_uuid: order.client_uuid,
    branch_id: order.branch_id,
    shift_id: resolvedShiftId,
    warehouse_id: payload.warehouse_id ?? undefined,
    created_at_local: order.created_at,
    status: order.status === 'failed' ? 'failed' : 'pending',
    last_error: order.error_message,
    sale_date: payload.sale_date ?? order.created_at,
  };
}
