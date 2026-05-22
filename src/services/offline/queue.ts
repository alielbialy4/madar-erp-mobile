import { storageGet, storageKeys, storageSet } from '@/services/storage';

export type OfflineMutation = {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload?: unknown;
  branch_id?: string | null;
  created_at_local: string;
  retry_count: number;
  status: 'pending' | 'syncing' | 'failed';
  last_error?: string | null;
};

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getOfflineQueue(): Promise<OfflineMutation[]> {
  return (await storageGet<OfflineMutation[]>(storageKeys.offlineQueue)) ?? [];
}

export async function enqueueOfflineMutation(input: Omit<OfflineMutation, 'id' | 'created_at_local' | 'retry_count' | 'status'>): Promise<OfflineMutation> {
  const queue = await getOfflineQueue();
  const row: OfflineMutation = {
    ...input,
    id: uuid(),
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
