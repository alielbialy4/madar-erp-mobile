import type { ListParams } from '@/types/api';
import { get, patch, post } from './client';

export type DeliveryStatusPayload = {
  status: string;
  notes?: string;
  collected_amount?: number;
  collection_note?: string;
  partial_collection_waiver?: boolean;
};

export const deliveriesAPI = {
  getAll: (params?: ListParams) => get('/deliveries', params),
  getById: (id: string) => get(`/deliveries/${id}`),
  assignDriver: (id: string, driverId: string) => post(`/deliveries/${id}/assign`, { driver_id: driverId }),
  updateStatus: (id: string, payload: DeliveryStatusPayload) => patch(`/deliveries/${id}/status`, payload),
  getToday: (params?: ListParams) => get('/deliveries/today', params),
};
