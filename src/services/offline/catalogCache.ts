import type { PosCatalog } from '@/types/api';
import type { CatalogCacheMeta } from '@/types/offline';
import { storageGet, storageKeys, storageSet } from '@/services/storage';

export async function savePosCatalog(catalog: PosCatalog, branchId?: string | null): Promise<void> {
  const now = new Date().toISOString();
  const meta: CatalogCacheMeta = {
    saved_at: now,
    updated_at: catalog.generated_at ?? now,
    branch_id: branchId ?? null,
    catalog,
  };
  await storageSet(storageKeys.posCatalog, meta);
}

export async function loadPosCatalog(): Promise<CatalogCacheMeta | null> {
  const raw = await storageGet<CatalogCacheMeta | { saved_at: string; catalog: PosCatalog }>(storageKeys.posCatalog);
  if (!raw) return null;
  if ('updated_at' in raw) return raw;
  return {
    saved_at: raw.saved_at,
    updated_at: raw.saved_at,
    branch_id: null,
    catalog: raw.catalog,
  };
}

export async function hasCachedCatalog(branchId?: string | null): Promise<boolean> {
  const cached = await loadPosCatalog();
  if (!cached?.catalog?.products?.length) return false;
  if (branchId && cached.branch_id && cached.branch_id !== branchId) return false;
  return true;
}
