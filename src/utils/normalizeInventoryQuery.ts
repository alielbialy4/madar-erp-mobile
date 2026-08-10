import type { ListParams } from '@/types/api';

/** Laravel query validation accepts boolean filters as 1/0, not "true"/"false" strings. */
export function normalizeExpiryStockParams(params?: ListParams): ListParams | undefined {
  if (!params) return undefined;
  const normalized = { ...params };
  for (const key of ['near_expiry_only', 'expired_only'] as const) {
    if (typeof normalized[key] === 'boolean') normalized[key] = normalized[key] ? 1 : 0;
  }
  return normalized;
}
