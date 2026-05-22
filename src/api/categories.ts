import type { Category, ListParams } from '@/types/api';
import { del, get, post, put } from './client';

export const categoriesAPI = {
  getAll: (params?: ListParams) => get<Category[]>('/categories', params),
  getById: (id: number) => get<Category>(`/categories/${id}`),
  create: (data: { name: string; description?: string; active?: boolean }) => post<Category>('/categories', data),
  update: (id: number, data: { name: string; description?: string; active?: boolean }) => put<Category>(`/categories/${id}`, data),
  delete: (id: number) => del(`/categories/${id}`),
  reorder: (items: { id: number; sort_order: number }[]) => post('/categories/reorder', { items }),
  reorderProducts: (categoryId: number, items: { id: number; sort_order: number }[]) => post(`/categories/${categoryId}/products/reorder`, { items }),
};
