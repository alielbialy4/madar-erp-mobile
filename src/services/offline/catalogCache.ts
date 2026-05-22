import type { PosCatalog } from '@/types/api';
import { storageGet, storageKeys, storageSet } from '@/services/storage';

export async function savePosCatalog(catalog: PosCatalog): Promise<void> {
  await storageSet(storageKeys.posCatalog, {
    saved_at: new Date().toISOString(),
    catalog,
  });
}

export async function loadPosCatalog(): Promise<{ saved_at: string; catalog: PosCatalog } | null> {
  return storageGet<{ saved_at: string; catalog: PosCatalog }>(storageKeys.posCatalog);
}
