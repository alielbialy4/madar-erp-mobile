import type { Coupon } from '@/types/api';
import { del, get, post, put } from './client';

export const couponsAPI = {
  validate: (params: { code: string; cart_total: number; customer_id?: number | null; branch_id?: string | null }) => post('/coupons/validate', params),
  list: (params?: Record<string, unknown>) => get<Coupon[]>('/coupons', params),
  get: (id: string) => get<Coupon>(`/coupons/${id}`),
  create: (data: Record<string, unknown>) => post('/coupons', data),
  update: (id: string, data: Record<string, unknown>) => put(`/coupons/${id}`, data),
  delete: (id: string) => del(`/coupons/${id}`),
};
