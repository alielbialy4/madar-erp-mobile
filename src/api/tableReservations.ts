import { get, post, put } from './client';

export type TableReservationPayload = {
  dining_table_id: string;
  customer_id?: number;
  reserved_from: string;
  reserved_to?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
};

export const tableReservationsAPI = {
  list: (
    branchId: string,
    params?: { status?: string; from?: string; to?: string; table_id?: string; per_page?: number },
  ) => get(`/branches/${branchId}/table-reservations`, params, { 'X-Branch-Id': branchId }),

  create: (branchId: string, payload: TableReservationPayload) =>
    post(`/branches/${branchId}/table-reservations`, payload, { 'X-Branch-Id': branchId }),

  update: (id: string, payload: Record<string, unknown>) => put(`/table-reservations/${id}`, payload),

  cancel: (id: string) => post(`/table-reservations/${id}/cancel`),
};
