import type { ListParams } from '@/types/api';
import { del, get, post, put } from './client';

export type DeliveryZonePayload = {
  branch_id: string;
  name: string;
  delivery_fee: number;
  is_active?: boolean;
  sort_order?: number;
  notes?: string | null;
};

export const deliveryZonesAPI = {
  getAll: (params?: ListParams) => get('/delivery-zones', params),
  getById: (id: string) => get(`/delivery-zones/${id}`),
  getActive: (params?: ListParams) => get('/delivery-zones/active', params),
  create: (data: DeliveryZonePayload) => post('/delivery-zones', data),
  update: (id: string, data: DeliveryZonePayload) => put(`/delivery-zones/${id}`, data),
  delete: (id: string) => del(`/delivery-zones/${id}`),
};
