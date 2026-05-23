import type { ApiEnvelope, ListParams } from '@/types/api';
import { get } from './client';

export type PaymentLedgerRow = {
  id: number | string;
  amount?: number | string | null;
  payment_method?: string | null;
  payment_type?: string | null;
  created_at?: string | null;
  invoice?: {
    invoice_number?: string | null;
    client?: { name?: string | null; phone_number?: string | null } | null;
  } | null;
  client_name?: string | null;
  client_phone?: string | null;
};

export type PaymentSafeTotals = {
  grand_total?: number | string | null;
  totals_by_safe?: Record<string, unknown> | null;
};

type PaymentFilter = {
  payment_method?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  invoice_number?: string | null;
  phone_number?: string | null;
};

export type PaymentListParams = ListParams & {
  limit?: number;
  term?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  filter?: PaymentFilter;
};

export const paymentsAPI = {
  getAll: (params?: PaymentListParams): Promise<ApiEnvelope<PaymentLedgerRow[]>> =>
    get<PaymentLedgerRow[]>('/mcp/invoices/payments/list', params),
  getSafeTotals: (params?: { start_date?: string | null; end_date?: string | null }): Promise<ApiEnvelope<PaymentSafeTotals>> =>
    get<PaymentSafeTotals>('/mcp/invoices/safe-totals', params),
};
