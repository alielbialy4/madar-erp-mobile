import type { SalePayload } from '@/types/api';
import { storageGet, storageKeys, storageSet } from '@/services/storage';

export type PendingOfflineOrder = SalePayload & {
  client_uuid: string;
  branch_id: string;
  created_at_local: string;
  status: 'pending' | 'failed';
  last_error?: string | null;
};

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getPendingOrders(): Promise<PendingOfflineOrder[]> {
  return (await storageGet<PendingOfflineOrder[]>(storageKeys.posPendingOrders)) ?? [];
}

export async function addPendingOrder(payload: SalePayload, branchId: string): Promise<PendingOfflineOrder> {
  const orders = await getPendingOrders();
  const order: PendingOfflineOrder = {
    ...payload,
    branch_id: branchId,
    client_uuid: uuid(),
    created_at_local: new Date().toISOString(),
    status: 'pending',
  };
  await storageSet(storageKeys.posPendingOrders, [...orders, order]);
  return order;
}

export async function removePendingOrders(ids: Set<string>): Promise<void> {
  const orders = await getPendingOrders();
  await storageSet(storageKeys.posPendingOrders, orders.filter((item) => !ids.has(item.client_uuid)));
}

export async function failPendingOrder(clientUuid: string, message: string): Promise<void> {
  const orders = await getPendingOrders();
  await storageSet(storageKeys.posPendingOrders, orders.map((item) => item.client_uuid === clientUuid ? { ...item, status: 'failed', last_error: message } : item));
}

export async function retryFailedOrders(ids?: Set<string>): Promise<number> {
  const orders = await getPendingOrders();
  let count = 0;
  await storageSet(
    storageKeys.posPendingOrders,
    orders.map((item) => {
      const shouldRetry = item.status === 'failed' && (!ids || ids.has(item.client_uuid));
      if (!shouldRetry) return item;
      count += 1;
      return { ...item, status: 'pending', last_error: null };
    }),
  );
  return count;
}
