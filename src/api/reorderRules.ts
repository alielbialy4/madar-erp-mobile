import { get, post, put } from './client';
import type { ListParams } from '@/types/api';

export const reorderRulesAPI = {
  list: (params?: ListParams) => get<Record<string, unknown>[]>('/inventory/reorder-rules', params),
  create: (payload: { product_id: number; threshold: number; reorder_to: number; is_active?: boolean; branch_id?: string }) =>
    post<Record<string, unknown>>('/inventory/reorder-rules', payload),
  update: (id: number, payload: Partial<{ threshold: number; reorder_to: number; is_active: boolean }>) =>
    put<Record<string, unknown>>(`/inventory/reorder-rules/${id}`, payload),
};
