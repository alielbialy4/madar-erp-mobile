import { get, post } from './client';

export type KitchenPrintJobStatus = 'pending' | 'processing' | 'printed' | 'failed' | 'cancelled';

export const kitchenPrintJobsAPI = {
  list: (params?: {
    status?: KitchenPrintJobStatus | 'all';
    station_id?: string;
    branch_id?: string;
    only_stuck?: boolean;
  }) => get('/kitchen-print-jobs', params),
  retry: (id: string) => post(`/kitchen-print-jobs/${id}/retry`),
  cancel: (id: string, payload?: { reason?: string }) => post(`/kitchen-print-jobs/${id}/cancel`, payload ?? {}),
  retryFailedBulk: () => post('/kitchen-print-jobs/retry-failed-bulk'),
  health: (params?: { branch_id?: string }) => get('/kitchen-print-jobs/health', params),
  reprintOrder: (saleId: number, payload?: { sale_item_ids?: number[] }) =>
    post(`/kitchen/orders/${saleId}/reprint`, payload ?? {}),
};
