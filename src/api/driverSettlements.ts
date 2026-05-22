import type { ListParams } from '@/types/api';
import { get, post } from './client';

export type DriverSettlementPayload = {
  branch_id?: string | null;
  driver_id: string;
  delivery_ids: string[];
  amount_received: number;
  vault_id: string;
  notes?: string | null;
};

export const driverSettlementsAPI = {
  unsettled: (params?: ListParams) => get('/driver-settlements/unsettled', params),
  list: (params?: ListParams) => get('/driver-settlements', params),
  get: (id: string) => get(`/driver-settlements/${id}`),
  create: (payload: DriverSettlementPayload) => post('/driver-settlements', payload),
};
