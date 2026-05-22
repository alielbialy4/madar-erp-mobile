import type { ListParams } from '@/types/api';
import { get } from './client';

export const activityLogsAPI = {
  getAll: (params?: ListParams & { user_id?: string; action?: string; model_type?: string; from_date?: string; to_date?: string }) =>
    get('/activity-logs', params),
  getById: (id: number | string) => get(`/activity-logs/${id}`),
};
