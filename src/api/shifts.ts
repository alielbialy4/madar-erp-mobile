import type { ActiveShift, ApiEnvelope, ListParams } from '@/types/api';
import type { ClosePreview, CurrentMeta, ShiftDetailedSummary, ShiftFilterUser, ShiftListRow } from '@/types/shifts';
import { get, post } from './client';

export const shiftsAPI = {
  filterUsers: (params?: { branch_id?: string }) => get<ShiftFilterUser[]>('/shifts/filter-users', params),
  current: (branchId?: string | null) =>
    get<ActiveShift | null>('/shifts/current', branchId ? { branch_id: branchId } : undefined) as Promise<
      ApiEnvelope<ActiveShift | null> & { meta?: CurrentMeta }
    >,
  list: (params?: ListParams & {
    from_date?: string;
    to_date?: string;
    status?: 'open' | 'closed';
    user_id?: number;
    branch_id?: string;
  }) => get<ShiftListRow[]>('/shifts', params),
  open: (payload: { vault_id: string; starting_cash: number | string; for_user_id?: number }) => post<ActiveShift>('/shifts/open', payload),
  previewClose: (shiftId: string) => get<ClosePreview>(`/shifts/${shiftId}/preview-close`),
  close: (shiftId: string, payload: { actual_cash: number | string; notes?: string }) => post(`/shifts/${shiftId}/close`, payload),
  getSummary: (shiftId: string, params?: { branch_id?: string }) => get<ShiftDetailedSummary>(`/shifts/${shiftId}/summary`, params),
};
