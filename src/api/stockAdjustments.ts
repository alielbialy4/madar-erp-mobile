import { del, get, post } from './client';
import type { ListParams } from '@/types/api';

export type StockAdjustmentItemPayload = {
  product_id: number;
  quantity: number;
  unit_cost: number;
  variant_id?: string | null;
  batch_id?: string | null;
};

export const stockAdjustmentsAPI = {
  list: (params?: ListParams) => get<Record<string, unknown>[]>('/stock-adjustments', params),
  get: (id: string) => get<Record<string, unknown>>(`/stock-adjustments/${id}`),
  create: (payload: {
    warehouse_id: string;
    type: 'addition' | 'subtraction';
    reason: string;
    items: StockAdjustmentItemPayload[];
  }) => post<Record<string, unknown>>('/stock-adjustments', payload),
  post: (id: string) => post<Record<string, unknown>>(`/stock-adjustments/${id}/post`),
  destroy: (id: string) => del(`/stock-adjustments/${id}`),
};
