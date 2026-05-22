import { get, patch, post, put } from './client';
import type { ListParams } from '@/types/api';

export type RequisitionStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled';

export const requisitionsAPI = {
  list: (params?: ListParams) => get<Record<string, unknown>[]>('/inventory/requisitions', params),
  get: (id: string) => get<Record<string, unknown>>(`/inventory/requisitions/${id}`),
  create: (payload: { notes?: string; items: { product_id: number; quantity: number }[]; branch_id?: string }) =>
    post<Record<string, unknown>>('/inventory/requisitions', payload),
  update: (id: string, payload: Partial<{ notes: string; items: { product_id: number; quantity: number }[] }>) =>
    put<Record<string, unknown>>(`/inventory/requisitions/${id}`, payload),
  updateStatus: (id: string, status: RequisitionStatus) =>
    patch<Record<string, unknown>>(`/inventory/requisitions/${id}/status`, { status }),
};
