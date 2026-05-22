import type { Category, ListParams } from '@/types/api';
import { del, get, post, postMultipart, putMultipart } from './client';
import { buildCategoryFormData, type CategoryPayload } from './formData';

export type { CategoryPayload } from './formData';

export type ReorderItem = { id: number; sort_order: number };

export const categoriesAPI = {
  getAll: (params?: ListParams) => get<Category[]>('/categories', params),
  getById: (id: number) => get<Category>(`/categories/${id}`),
  create: (data: CategoryPayload) => postMultipart<Category>('/categories', buildCategoryFormData(data)),
  update: (id: number, data: CategoryPayload) =>
    putMultipart<Category>(`/categories/${id}`, buildCategoryFormData(data, true)),
  delete: (id: number) => del(`/categories/${id}`),
  reorder: (items: ReorderItem[]) => post('/categories/reorder', { items }),
  reorderProducts: (categoryId: number, items: ReorderItem[]) =>
    post(`/categories/${categoryId}/products/reorder`, { items }),
};
