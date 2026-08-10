import { storageGet, storageKeys, storageSet } from '@/services/storage';
import { createUuid } from '@/utils/uuid';

export type OfflineTableOp = {
  id: string;
  client_uuid: string;
  branch_id?: string | null;
  op_type: string;
  payload: unknown;
  created_at_local: string;
  retry_count: number;
  status: 'pending' | 'syncing' | 'failed';
  last_error?: string | null;
};

function isTableOp(item: unknown): item is OfflineTableOp {
  if (!item || typeof item !== 'object') return false;
  const row = item as OfflineTableOp;
  return Boolean(row.id && row.client_uuid && row.op_type && row.status);
}

export async function getTableOpsQueue(): Promise<OfflineTableOp[]> {
  const raw = await storageGet<OfflineTableOp[]>(storageKeys.offlineTableOps);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isTableOp);
}

export async function getFailedTableOps(): Promise<OfflineTableOp[]> {
  const queue = await getTableOpsQueue();
  return queue.filter((item) => item.status === 'failed');
}

export async function enqueueTableOp(
  input: Omit<OfflineTableOp, 'id' | 'client_uuid' | 'created_at_local' | 'retry_count' | 'status'>,
): Promise<OfflineTableOp> {
  const queue = await getTableOpsQueue();
  const row: OfflineTableOp = {
    ...input,
    id: createUuid(),
    client_uuid: createUuid(),
    created_at_local: new Date().toISOString(),
    retry_count: 0,
    status: 'pending',
  };
  await storageSet(storageKeys.offlineTableOps, [...queue, row]);
  return row;
}

export async function moveFailedTableOpsToPending(ids?: Set<string>): Promise<number> {
  const queue = await getTableOpsQueue();
  let count = 0;
  const next = queue.map((item) => {
    if (item.status !== 'failed') return item;
    if (ids && !ids.has(item.id)) return item;
    count += 1;
    return { ...item, status: 'pending' as const, last_error: null };
  });
  await storageSet(storageKeys.offlineTableOps, next);
  return count;
}

export async function removeFailedTableOpById(id: string): Promise<void> {
  const queue = await getTableOpsQueue();
  await storageSet(
    storageKeys.offlineTableOps,
    queue.filter((item) => item.id !== id),
  );
}

export async function markTableOpFailed(id: string, message: string): Promise<void> {
  const queue = await getTableOpsQueue();
  await storageSet(
    storageKeys.offlineTableOps,
    queue.map((item) =>
      item.id === id
        ? {
            ...item,
            retry_count: item.retry_count + 1,
            status: 'failed' as const,
            last_error: message,
          }
        : item,
    ),
  );
}

export function countTableOpsByStatus(ops: OfflineTableOp[]) {
  return {
    pending: ops.filter((o) => o.status === 'pending' || o.status === 'syncing').length,
    failed: ops.filter((o) => o.status === 'failed').length,
    syncing: ops.filter((o) => o.status === 'syncing').length,
  };
}
