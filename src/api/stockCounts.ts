import { get, post, put } from './client';
import type { ListParams } from '@/types/api';

export type StockCountItemPayload = {
  product_id: number;
  counted_quantity: number;
  variant_id?: string | null;
  batch_id?: string | null;
};

export const stockCountsAPI = {
  list: (params?: ListParams) => get<Record<string, unknown>[]>('/inventory/stock-counts', params),
  get: (id: string) => get<Record<string, unknown>>(`/inventory/stock-counts/${id}`),
  create: (payload: { warehouse_id: string; notes?: string; branch_id?: string }) =>
    post<Record<string, unknown>>('/inventory/stock-counts', payload),
  upsertItems: (id: string, items: StockCountItemPayload[]) =>
    put<Record<string, unknown>>(`/inventory/stock-counts/${id}/items`, { items }),
  post: (id: string) => post<Record<string, unknown>>(`/inventory/stock-counts/${id}/post`),
};
