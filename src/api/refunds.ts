import { get } from './client';

export const refundsAPI = {
  getAll: (params?: Record<string, unknown>) => get<Record<string, unknown>[]>('/refunds', params),
  getById: (id: number) => get<Record<string, unknown>>(`/refunds/${id}`),
};
