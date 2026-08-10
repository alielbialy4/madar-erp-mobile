import type { InventoryBalance, ListParams, Warehouse } from '@/types/api';
import { normalizeExpiryStockParams } from '@/utils/normalizeInventoryQuery';
import { del, get, post, put } from './client';

export type { InventoryBalance };

export const inventoryAPI = {
  warehouses: () => get<Warehouse[]>('/inventory/warehouses'),
  balances: (params?: ListParams) => get<InventoryBalance[]>('/inventory/balances', params),
  products: (params?: ListParams) => get('/inventory/products', params),
  expiryStock: (params?: ListParams) => get('/inventory/expiry-stock', normalizeExpiryStockParams(params)),
  movements: (params?: ListParams) => get('/inventory/movements', params),
  seedBalances: () => post('/inventory/seed-balances'),
  createStockTransfer: (payload: unknown) => post('/stock-transfers', payload),
  completeStockTransfer: (id: string) => post(`/stock-transfers/${id}/complete`),
  createStockAdjustment: (payload: unknown) => post('/stock-adjustments', payload),
  postStockAdjustment: (id: string) => post(`/stock-adjustments/${id}/post`),
};

export const warehousesAPI = {
  list: (params?: ListParams) => get<Warehouse[]>('/warehouses', params),
  get: (id: string, params?: ListParams) => get<Warehouse>(`/warehouses/${id}`, params),
  create: (payload: Partial<Warehouse>) => post<Warehouse>('/warehouses', payload),
  update: (id: string, payload: Partial<Warehouse>) => put<Warehouse>(`/warehouses/${id}`, payload),
  delete: (id: string) => del(`/warehouses/${id}`),
};
