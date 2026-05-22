import type { ListParams } from '@/types/api';
import { del, get, post, put } from './client';

export type DriverPayload = {
  name: string;
  phone: string;
  branch_id?: string;
  vehicle_info?: string;
  vehicle_plate?: string;
  status?: string;
};

export const driversAPI = {
  getAll: (params?: ListParams) => get('/drivers', params),
  getActive: (params?: ListParams) => get('/drivers/all', params),
  getById: (id: string) => get(`/drivers/${id}`),
  create: (data: DriverPayload) => post('/drivers', data),
  update: (id: string, data: DriverPayload) => put(`/drivers/${id}`, data),
  toggleStatus: (id: string) => post(`/drivers/${id}/toggle`),
  delete: (id: string) => del(`/drivers/${id}`),
};
