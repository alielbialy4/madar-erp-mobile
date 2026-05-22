import { get, post } from './client';

export const supplierPaymentsAPI = {
  getAll: (params?: Record<string, unknown>) => get('/supplier-payments', params),
  create: (data: { supplier_id: number; purchase_id?: number | null; vault_id: string; amount: number | string; payment_date: string; payment_method?: string; reference_no?: string; notes?: string }) => post('/supplier-payments', data),
  getSettleableBalance: (supplierId: number, purchaseId: number) => get(`/suppliers/${supplierId}/settleable-balance`, { purchase_id: purchaseId }),
};
