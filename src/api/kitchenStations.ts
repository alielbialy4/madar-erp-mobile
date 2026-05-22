import type { ListParams } from '@/types/api';
import { del, get, post, put } from './client';

export type KitchenStationPayload = {
  branch_id?: string;
  name: string;
  code?: string | null;
  color?: string | null;
  printer_name?: string | null;
  auto_print_enabled?: boolean;
  copies_count?: number;
  sla_minutes?: number | null;
  is_active?: boolean;
  sort_order?: number;
  notes?: string | null;
};

export const kitchenStationsAPI = {
  list: (params?: ListParams & { is_active?: boolean; branch_id?: string }) => get('/kitchen-stations', params),
  active: (params?: { branch_id?: string }) => get('/kitchen-stations/active', params),
  get: (id: string) => get(`/kitchen-stations/${id}`),
  create: (payload: KitchenStationPayload) => post('/kitchen-stations', payload),
  update: (id: string, payload: Partial<KitchenStationPayload>) => put(`/kitchen-stations/${id}`, payload),
  remove: (id: string) => del(`/kitchen-stations/${id}`),
};
