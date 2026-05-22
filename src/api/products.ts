import type { ListParams, Product, ProductInsightsParams, ProductPayload } from '@/types/api';
import { del, get, postMultipart, putMultipart } from './client';
import { buildProductFormData } from './formData';

export type { ProductPayload } from '@/types/api';

export const productsAPI = {
  getAll: (params?: ListParams) => get<Product[]>('/products', params),
  getById: (id: number) => get<Product>(`/products/${id}`),
  getInsights: (id: number | string, params?: ProductInsightsParams) =>
    get<Record<string, unknown>>(`/products/${id}/insights`, params),
  search: (query: string) => get<Product[]>('/products/search', { query }),
  create: (data: ProductPayload) => postMultipart<Product>('/products', buildProductFormData(data)),
  update: (id: number, data: ProductPayload) =>
    putMultipart<Product>(`/products/${id}`, buildProductFormData(data, true)),
  delete: (id: number) => del(`/products/${id}`),
};
