import type { ActiveShift, ListParams } from '@/types/api';
import { get, post } from './client';

export const shiftsAPI = {
  filterUsers: (params?: { branch_id?: string }) => get('/shifts/filter-users', params),
  current: (branchId?: string | null) => get<ActiveShift | null>('/shifts/current', branchId ? { branch_id: branchId } : undefined),
  list: (params?: ListParams) => get('/shifts', params),
  open: (payload: { vault_id: string; starting_cash: number | string; for_user_id?: number }) => post<ActiveShift>('/shifts/open', payload),
  previewClose: (shiftId: string) => get(`/shifts/${shiftId}/preview-close`),
  close: (shiftId: string, payload: { actual_cash: number | string; notes?: string }) => post(`/shifts/${shiftId}/close`, payload),
  getSummary: (shiftId: string, params?: { branch_id?: string }) => get(`/shifts/${shiftId}/summary`, params),
};
