import { posAPI } from '@/api/pos';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { usePosStore } from '@/store/posStore';
import { coercePendingOrderForSync } from '@/services/offline/coercePendingOrder';
import {
  failPendingOrder,
  getOrdersForSync,
  markOrderSynced,
  markOrdersSyncing,
  removePendingOrders,
  resetOrdersToPending,
  resetSyncingOrdersToPending,
  toApiOfflineOrder,
} from '@/services/offline/posOrders';
import { getOfflineQueue, markOfflineMutationFailed, removeOfflineMutations } from '@/services/offline/queue';
import { apiClient } from '@/api/client';
import { printEngine } from '@/services/printing/printEngine';
import type { OfflinePosOrderRecord } from '@/types/offline';

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
        headers: {
          ...(item.branch_id ? { 'X-Branch-Id': item.branch_id } : {}),
          'Idempotency-Key': item.idempotency_key || item.client_uuid || item.id,
          'X-Client-UUID': item.client_uuid || item.id,
        },
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

  try {
    await resetSyncingOrdersToPending();

    const rawOrders = (await getOrdersForSync()).filter((o) => o.status === 'pending' || o.status === 'failed');
    if (!rawOrders.length) return { pushed: 0, errors: [] };

    const errors: string[] = [];
    let pushed = 0;
    const dropBroken = new Set<string>();
    const toSend: OfflinePosOrderRecord[] = [];

    for (const raw of rawOrders) {
      const fixed = coercePendingOrderForSync(raw);
      if (!fixed) {
        const id = raw.client_uuid || raw.client_order_id;
        if (id) dropBroken.add(id);
        errors.push(`${id || '—'}: طلب بدون بنود — تُزال من المزامنة المحلية`);
        continue;
      }
      const branchId = String(fixed.branch_id || '').trim();
      if (!branchId) {
        errors.push(`${fixed.client_uuid}: طلب بدون فرع — لا يمكن مزامنته بأمان`);
        await failPendingOrder(fixed.client_order_id, 'Missing branch_id');
        continue;
      }
      toSend.push(fixed);
    }

    if (dropBroken.size > 0) {
      await removePendingOrders(dropBroken);
    }

    if (!toSend.length) {
      return { pushed: 0, errors };
    }

    const byBranch = new Map<string, OfflinePosOrderRecord[]>();
    for (const order of toSend) {
      const group = byBranch.get(order.branch_id) ?? [];
      group.push(order);
      byBranch.set(order.branch_id, group);
    }

    for (const [branchId, branchOrders] of byBranch.entries()) {
      const clientIds = branchOrders.map((o) => o.client_order_id);
      await markOrdersSyncing(clientIds);

      try {
        const openShiftId = usePosStore.getState().openShiftId;
        const apiOrders = branchOrders.map((order) => toApiOfflineOrder(order, openShiftId));
        const response = await posAPI.pushOfflineOrders(apiOrders, branchId);

        if (response.status !== 'success' || !Array.isArray(response.data)) {
          const msg = response.message || `فشل مزامنة الفرع ${branchId}: استجابة غير صالحة من الخادم`;
          errors.push(msg);
          await resetOrdersToPending(clientIds, msg);
          continue;
        }

        const rows = response.data;
        const done = new Set<string>();
        const failed = new Set<string>();

        for (const row of rows) {
          if (row.status === 'created' || row.status === 'duplicate') {
            done.add(row.client_uuid);
            pushed += 1;
            await markOrderSynced(row.client_uuid, row.sale_id, row.invoice_number ?? null);
          } else if (row.status === 'error') {
            const msg = row.message ?? 'فشل مزامنة الطلب';
            errors.push(`${row.client_uuid}: ${msg}`);
            failed.add(row.client_uuid);
            await failPendingOrder(row.client_uuid, msg);
          } else if (row.client_uuid) {
            const msg = `استجابة غير متوقعة من الخادم (${row.status ?? 'unknown'})`;
            errors.push(`${row.client_uuid}: ${msg}`);
            failed.add(row.client_uuid);
            await failPendingOrder(row.client_uuid, msg);
          }
        }

        const unhandled = clientIds.filter((id) => !done.has(id) && !failed.has(id));
        if (unhandled.length > 0) {
          const msg = 'لم يُرجع الخادم نتيجة لهذا الطلب';
          errors.push(...unhandled.map((id) => `${id}: ${msg}`));
          await resetOrdersToPending(unhandled, msg);
        }

        await removePendingOrders(done);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'فشل مزامنة طلبات نقطة البيع';
        errors.push(message);
        await resetOrdersToPending(clientIds, message);
      }
    }

    if (pushed > 0) {
      void usePosStore.getState().loadCatalog();
    }

    return { pushed, errors };
  } catch (err) {
    if (__DEV__) {
      console.error('[sync] syncPendingPosOrders failed', err instanceof Error ? err.stack : err);
    }
    const message = err instanceof Error ? err.message : 'فشل مزامنة طلبات نقطة البيع';
    return { pushed: 0, errors: [message] };
  }
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
