import { storageGet, storageKeys, storageSet } from '@/services/storage';
import { createUuid } from '@/utils/uuid';

export type OfflineMutation = {
  id: string;
  client_uuid: string;
  idempotency_key: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload?: unknown;
  branch_id?: string | null;
  created_at_local: string;
  retry_count: number;
  status: 'pending' | 'syncing' | 'failed';
  last_error?: string | null;
};

export async function getOfflineQueue(): Promise<OfflineMutation[]> {
  return (await storageGet<OfflineMutation[]>(storageKeys.offlineQueue)) ?? [];
}

export async function enqueueOfflineMutation(input: Omit<OfflineMutation, 'id' | 'client_uuid' | 'idempotency_key' | 'created_at_local' | 'retry_count' | 'status'>): Promise<OfflineMutation> {
  const queue = await getOfflineQueue();
  const row: OfflineMutation = {
    ...input,
    id: createUuid(),
    client_uuid: createUuid(),
    idempotency_key: createUuid(),
    created_at_local: new Date().toISOString(),
    retry_count: 0,
    status: 'pending',
  };
  await storageSet(storageKeys.offlineQueue, [...queue, row]);
  return row;
}

export async function removeOfflineMutations(ids: Set<string>): Promise<void> {
  const queue = await getOfflineQueue();
  await storageSet(storageKeys.offlineQueue, queue.filter((item) => !ids.has(item.id)));
}

export async function markOfflineMutationFailed(id: string, message: string): Promise<void> {
  const queue = await getOfflineQueue();
  await storageSet(storageKeys.offlineQueue, queue.map((item) => item.id === id ? { ...item, retry_count: item.retry_count + 1, status: 'failed', last_error: message } : item));
}

export async function requeueOfflineMutations(ids?: Set<string>): Promise<number> {
  const queue = await getOfflineQueue();
  let count = 0;
  const next = queue.map((item) => {
    if (item.status !== 'failed') return item;
    if (ids && !ids.has(item.id)) return item;
    count += 1;
    return { ...item, status: 'pending' as const, last_error: null };
  });
  await storageSet(storageKeys.offlineQueue, next);
  return count;
}
