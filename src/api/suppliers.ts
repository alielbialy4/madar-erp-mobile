import type { ListParams } from '@/types/api';
import { del, get, post, put } from './client';

export const suppliersAPI = {
  getAll: (params?: ListParams) =>
    get<Record<string, unknown>[]>('/suppliers', { balance_detail: 1, ...(params ?? {}) }),
  getById: (id: number | string) => get<Record<string, unknown>>(`/suppliers/${id}`),
  create: (data: Record<string, unknown>) => post('/suppliers', data),
  update: (id: number | string, data: Record<string, unknown>) => put(`/suppliers/${id}`, data),
  delete: (id: number | string) => del(`/suppliers/${id}`),
  report: (id: number | string, params?: ListParams) => get(`/suppliers/${id}/report`, params),
  statement: (id: number | string, params?: ListParams) => get<Record<string, unknown>>(`/suppliers/${id}/statement`, params),
};
