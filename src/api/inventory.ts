import type { ListParams, Warehouse } from '@/types/api';
import { del, get, post, put } from './client';

export type InventoryBalance = {
  id: string;
  product_id: number;
  product?: { id: number; name: string; barcode?: string | null; unit?: string | null; min_stock_alert?: number };
  warehouse_name?: string | null;
  branch_name?: string | null;
  category_name?: string | null;
  quantity: number;
  balance_status_label_ar?: string;
  batch?: { batch_number?: string | null; expiry_date?: string | null } | null;
};

export const inventoryAPI = {
  warehouses: () => get<Warehouse[]>('/inventory/warehouses'),
  balances: (params?: ListParams) => get<InventoryBalance[]>('/inventory/balances', params),
  products: (params?: ListParams) => get('/inventory/products', params),
  expiryStock: (params?: ListParams) => get('/inventory/expiry-stock', params),
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
