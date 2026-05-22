import type { ListParams, Promotion } from '@/types/api';
import { get, post } from './client';

export const promotionsAPI = {
  getAll: (params?: ListParams) => get<Promotion[]>('/promotions', params),
  getById: (id: number) => get<Promotion>(`/promotions/${id}`),
  preview: (data: { cart_items: Record<string, unknown>[]; cart_total: number; branch_id?: string | null }) => post('/promotions/preview', data),
};
