import type { ListParams, Promotion } from '@/types/api';
import { del, get, post, put } from './client';

export const promotionsAPI = {
  getAll: (params?: ListParams) => get<Promotion[]>('/promotions', params),
  getById: (id: number | string) => get<Promotion>(`/promotions/${id}`),
  create: (data: Record<string, unknown>) => post('/promotions', data),
  update: (id: number | string, data: Record<string, unknown>) => put(`/promotions/${id}`, data),
  delete: (id: number | string) => del(`/promotions/${id}`),
  preview: (data: { cart_items: Record<string, unknown>[]; cart_total: number; branch_id?: string | null }) => post('/promotions/preview', data),
};
