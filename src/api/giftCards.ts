import type { ListParams } from '@/types/api';
import { get, post } from './client';

export const giftCardsAPI = {
  getAll: (params?: ListParams) => get('/gift-cards', params),
  getById: (id: string) => get(`/gift-cards/${id}`),
  check: (code: string) => post('/gift-cards/check', { code }),
  redeem: (id: string, data: { amount: number; sale_id?: number; customer_id?: number }) => post(`/gift-cards/${id}/redeem`, data),
};
