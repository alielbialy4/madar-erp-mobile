import { get, post, put } from './client';
import type { ListParams } from '@/types/api';
import { extractArray } from '@/utils/data';

export const reorderRulesAPI = {
  list: (params?: ListParams) => get<Record<string, unknown>[]>('/inventory/reorder-rules', params),
  findById: async (id: number) => {
    let page = 1;
    let lastPage = 1;
    while (page <= lastPage && page <= 20) {
      const res = await get<Record<string, unknown>[]>('/inventory/reorder-rules', { per_page: 50, page });
      const rows = extractArray<Record<string, unknown>>(res);
      const found = rows.find((r) => Number(r.id) === id);
      if (found) return found;
      const pagination = (res as { pagination?: { last_page?: number } }).pagination;
      lastPage = pagination?.last_page ?? page;
      page += 1;
    }
    return null;
  },
  create: (payload: { product_id: number; threshold: number; reorder_to: number; is_active?: boolean; branch_id?: string }) =>
    post<Record<string, unknown>>('/inventory/reorder-rules', payload),
  update: (id: number, payload: Partial<{ threshold: number; reorder_to: number; is_active: boolean }>) =>
    put<Record<string, unknown>>(`/inventory/reorder-rules/${id}`, payload),
};
