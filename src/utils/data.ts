import type { ApiEnvelope, PaginationMeta } from '@/types/api';

export function extractData<T>(response: ApiEnvelope<T> | T | undefined | null): T | undefined {
  if (!response) return undefined;
  if (typeof response === 'object' && 'data' in response) return (response as ApiEnvelope<T>).data;
  return response as T;
}

export function extractArray<T>(response: unknown): T[] {
  if (!response) return [];
  const envelope = response as ApiEnvelope<unknown>;
  const data = envelope.data;
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['items', 'rows', 'sales', 'products', 'customers', 'suppliers', 'purchases', 'transactions', 'tables', 'orders', 'notifications', 'refunds', 'expenses', 'coupons', 'balances']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  if (Array.isArray(response)) return response as T[];
  return [];
}

export function extractPagination(response: unknown): PaginationMeta | undefined {
  if (!response || typeof response !== 'object') return undefined;
  const obj = response as Record<string, unknown>;
  if (obj.pagination && typeof obj.pagination === 'object') return obj.pagination as PaginationMeta;
  const data = obj.data;
  if (data && typeof data === 'object' && 'pagination' in data) {
    return (data as Record<string, unknown>).pagination as PaginationMeta;
  }
  return undefined;
}

export function firstError(errors?: Record<string, string[] | string>): string | undefined {
  if (!errors) return undefined;
  const first = Object.values(errors)[0];
  return Array.isArray(first) ? first[0] : first;
}
