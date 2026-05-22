import type { ListParams } from '@/types/api';
import { get, patch, post } from './client';

export const deliveriesAPI = {
  getAll: (params?: ListParams) => get('/deliveries', params),
  getById: (id: string) => get(`/deliveries/${id}`),
  assignDriver: (id: string, driverId: string) => post(`/deliveries/${id}/assign`, { driver_id: driverId }),
  updateStatus: (id: string, status: string, notes?: string) => patch(`/deliveries/${id}/status`, { status, notes }),
  getZones: (params?: ListParams) => get('/delivery-zones', params),
};
