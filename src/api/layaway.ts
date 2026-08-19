import type { ListParams } from '@/types/api';
import { get, post } from './client';

export type LayawayInstallment = {
  id: string;
  installment_no: number;
  due_date?: string | null;
  amount: number | string;
  paid_amount?: number | string | null;
  status?: string | null;
  paid_at?: string | null;
};

export type LayawayPlan = {
  id: string;
  sale_id?: number | null;
  customer_id?: number | null;
  branch_id?: string | null;
  total_amount?: number | string | null;
  paid_amount?: number | string | null;
  installment_count?: number | null;
  installment_amount?: number | string | null;
  next_due_date?: string | null;
  status?: string | null;
  notes?: string | null;
  customer?: { id: number; name: string; phone?: string | null } | null;
  installments?: LayawayInstallment[];
};

export type LayawayPaymentPayload = {
  amount: number;
  payment_method: string;
  financial_account_id?: string | null;
  vault_id?: string | null;
  notes?: string;
  idempotency_key?: string;
};

export const layawayAPI = {
  list: (params?: ListParams) => get<LayawayPlan[]>('/layaway', params),
  get: (id: string) => get<LayawayPlan>(`/layaway/${id}`),
  addPayment: (id: string, payload: LayawayPaymentPayload) => post<LayawayPlan>(`/layaway/${id}/payments`, payload),
  installments: (id: string) => get<LayawayInstallment[]>(`/layaway/${id}/installments`),
  payInstallment: (id: string, installmentId: string, payload: LayawayPaymentPayload) =>
    post<LayawayPlan>(`/layaway/${id}/installments/${installmentId}/pay`, payload),
  cancel: (id: string, payload?: { notes?: string }) => post<LayawayPlan>(`/layaway/${id}/cancel`, payload ?? {}),
};
