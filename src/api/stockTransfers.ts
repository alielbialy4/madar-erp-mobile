import { del, get, patch, post } from './client';
import type { ListParams } from '@/types/api';

export type StockTransferItemPayload = {
  product_id: number;
  quantity: number;
  variant_id?: string | null;
  batch_id?: string | null;
};

export const stockTransfersAPI = {
  list: (params?: ListParams) => get<Record<string, unknown>[]>('/stock-transfers', params),
  get: (id: string) => get<Record<string, unknown>>(`/stock-transfers/${id}`),
  create: (payload: {
    from_warehouse_id: string;
    to_warehouse_id: string;
    shipping_cost?: number;
    items: StockTransferItemPayload[];
  }) => post<Record<string, unknown>>('/stock-transfers', payload),
  complete: (id: string) => post<Record<string, unknown>>(`/stock-transfers/${id}/complete`),
  updateStatus: (id: string, status: 'pending' | 'in_transit' | 'rejected') =>
    patch<Record<string, unknown>>(`/stock-transfers/${id}/status`, { status }),
  destroy: (id: string) => del(`/stock-transfers/${id}`),
};
