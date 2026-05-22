import type { ListParams, Product } from '@/types/api';
import { del, get, post, put } from './client';

export type ProductPayload = {
  name: string;
  barcode?: string;
  description?: string;
  category_id?: number;
  cost_price: number;
  selling_price: number;
  min_stock_alert: number;
  track_inventory?: boolean;
  active?: boolean;
  featured?: boolean;
  units: { id?: number; name: string; factor_to_base: number; is_base: boolean; barcode?: string }[];
};

export const productsAPI = {
  getAll: (params?: ListParams) => get<Product[]>('/products', params),
  getById: (id: number) => get<Product>(`/products/${id}`),
  getInsights: (id: number | string, params?: Record<string, unknown>) => get(`/products/${id}/insights`, params),
  search: (query: string) => get<Product[]>('/products/search', { query }),
  create: (data: ProductPayload) => post<Product>('/products', data),
  update: (id: number, data: ProductPayload) => put<Product>(`/products/${id}`, data),
  delete: (id: number) => del(`/products/${id}`),
};
