import { posAPI } from '@/api/pos';
import { getOfflineQueue, markOfflineMutationFailed, removeOfflineMutations } from '@/services/offline/queue';
import { getPendingOrders, removePendingOrders, failPendingOrder } from '@/services/offline/posOrders';
import { apiClient } from '@/api/client';

let syncing = false;

export async function syncOfflineMutations(): Promise<{ pushed: number; errors: string[] }> {
  if (syncing) return { pushed: 0, errors: [] };
  syncing = true;
  const errors: string[] = [];
  const done = new Set<string>();
  try {
    const queue = await getOfflineQueue();
    for (const item of queue) {
      try {
        await apiClient.request({ url: item.url, method: item.method, data: item.payload, headers: item.branch_id ? { 'X-Branch-Id': item.branch_id } : undefined });
        done.add(item.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'فشل المزامنة';
        errors.push(`${item.url}: ${message}`);
        await markOfflineMutationFailed(item.id, message);
      }
    }
    await removeOfflineMutations(done);
    return { pushed: done.size, errors };
  } finally {
    syncing = false;
  }
}

export async function syncPendingPosOrders(): Promise<{ pushed: number; errors: string[] }> {
  const orders = await getPendingOrders();
  const errors: string[] = [];
  let pushed = 0;
  const byBranch = new Map<string, typeof orders>();
  for (const order of orders.filter((item) => item.status === 'pending')) {
    const group = byBranch.get(order.branch_id) ?? [];
    group.push(order);
    byBranch.set(order.branch_id, group);
  }
  for (const [branchId, branchOrders] of byBranch.entries()) {
    try {
      const response = await posAPI.pushOfflineOrders(branchOrders, branchId);
      const rows = Array.isArray(response.data) ? response.data : [];
      const done = new Set<string>();
      for (const row of rows) {
        if (row.status === 'created' || row.status === 'duplicate') {
          done.add(row.client_uuid);
          pushed += 1;
        } else if (row.status === 'error') {
          errors.push(`${row.client_uuid}: ${row.message ?? 'فشل مزامنة الطلب'}`);
          await failPendingOrder(row.client_uuid, row.message ?? 'فشل مزامنة الطلب');
        }
      }
      await removePendingOrders(done);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'فشل مزامنة طلبات نقطة البيع');
    }
  }
  return { pushed, errors };
}

export async function syncAll(): Promise<{ pushed: number; errors: string[] }> {
  const [mutations, pos] = await Promise.all([syncOfflineMutations(), syncPendingPosOrders()]);
  return { pushed: mutations.pushed + pos.pushed, errors: [...mutations.errors, ...pos.errors] };
}
