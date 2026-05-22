import { posAPI } from '@/api/pos';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import {
  failPendingOrder,
  getPendingOrders,
  markOrderSynced,
  markOrderSyncing,
  removePendingOrders,
  toApiOfflineOrder,
} from '@/services/offline/posOrders';
import { getOfflineQueue, markOfflineMutationFailed, removeOfflineMutations } from '@/services/offline/queue';
import { apiClient } from '@/api/client';
import { printEngine } from '@/services/printing/printEngine';

let syncing = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

export type SyncResult = { pushed: number; errors: string[]; skipped?: boolean };

export function canSync(): { ok: boolean; reason?: string } {
  const token = useAuthStore.getState().token;
  const branch = useBranchStore.getState().activeBranch;
  if (!token) return { ok: false, reason: 'لا يوجد جلسة دخول' };
  if (!branch?.id) return { ok: false, reason: 'يجب اختيار فرع' };
  return { ok: true };
}

export async function syncOfflineMutations(): Promise<SyncResult> {
  const queue = await getOfflineQueue();
  if (!queue.length) return { pushed: 0, errors: [] };
  const errors: string[] = [];
  const done = new Set<string>();
  for (const item of queue.filter((q) => q.status === 'pending')) {
    try {
      await apiClient.request({
        url: item.url,
        method: item.method,
        data: item.payload,
        headers: item.branch_id ? { 'X-Branch-Id': item.branch_id } : undefined,
      });
      done.add(item.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل المزامنة';
      errors.push(`${item.url}: ${message}`);
      await markOfflineMutationFailed(item.id, message);
    }
  }
  await removeOfflineMutations(done);
  return { pushed: done.size, errors };
}

export async function syncPendingPosOrders(): Promise<SyncResult> {
  const guard = canSync();
  if (!guard.ok) return { pushed: 0, errors: [], skipped: true };

  const orders = (await getPendingOrders()).filter((o) => o.status === 'pending');
  if (!orders.length) return { pushed: 0, errors: [] };

  const errors: string[] = [];
  let pushed = 0;
  const byBranch = new Map<string, typeof orders>();
  for (const order of orders) {
    const group = byBranch.get(order.branch_id) ?? [];
    group.push(order);
    byBranch.set(order.branch_id, group);
  }

  for (const [branchId, branchOrders] of byBranch.entries()) {
    for (const order of branchOrders) {
      await markOrderSyncing(order.client_order_id);
    }
    try {
      const apiOrders = branchOrders.map(toApiOfflineOrder);
      const response = await posAPI.pushOfflineOrders(apiOrders, branchId);
      const rows = Array.isArray(response.data) ? response.data : [];
      const done = new Set<string>();
      for (const row of rows) {
        if (row.status === 'created' || row.status === 'duplicate') {
          done.add(row.client_uuid);
          pushed += 1;
          await markOrderSynced(row.client_uuid, row.sale_id, row.invoice_number ?? null);
        } else if (row.status === 'error') {
          const msg = row.message ?? 'فشل مزامنة الطلب';
          errors.push(`${row.client_uuid}: ${msg}`);
          await failPendingOrder(row.client_uuid, msg);
        }
      }
      await removePendingOrders(done);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل مزامنة طلبات نقطة البيع';
      errors.push(message);
      for (const order of branchOrders) {
        await failPendingOrder(order.client_order_id, message);
      }
    }
  }
  return { pushed, errors };
}

export async function syncAll(): Promise<SyncResult> {
  if (syncing) return { pushed: 0, errors: [], skipped: true };
  const guard = canSync();
  if (!guard.ok) return { pushed: 0, errors: guard.reason ? [guard.reason] : [], skipped: true };

  syncing = true;
  try {
    const [mutations, pos] = await Promise.all([syncOfflineMutations(), syncPendingPosOrders()]);
    void printEngine.processPendingQueue();
    return { pushed: mutations.pushed + pos.pushed, errors: [...mutations.errors, ...pos.errors] };
  } finally {
    syncing = false;
  }
}

export function startSyncInterval(ms = 60_000): () => void {
  stopSyncInterval();
  intervalId = setInterval(() => {
    void syncAll();
  }, ms);
  return stopSyncInterval;
}

export function stopSyncInterval(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function isSyncInProgress(): boolean {
  return syncing;
}
