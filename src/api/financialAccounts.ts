import type { ApiEnvelope, FinancialAccount, FinancialAccountTransaction, ListParams } from '@/types/api';
import { get, post } from './client';

export type PaymentSource = FinancialAccount & {
  simple_type?: string | null;
  simple_type_label?: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  balance?: number | string | null;
  linked_vault_id?: string | null;
  is_available?: boolean;
  unavailable_reason?: string | null;
  selection_key?: string;
  is_cash?: boolean;
};

export type FinancialAccountTransactionPage = {
  data: FinancialAccountTransaction[];
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
};

export type ExternalMovementPayload = {
  branch_id?: string | null;
  amount: number | string;
  classification?: string;
  reference?: string;
  notes?: string;
  occurred_at?: string;
  idempotency_key: string;
};

export const financialAccountsAPI = {
  list: (params?: ListParams) => get<FinancialAccount[]>('/financial-accounts', params),
  get: (id: string) => get<FinancialAccount>(`/financial-accounts/${id}`),
  available: (params: { branch_id: string; payment_method?: string; capability?: string }) =>
    get<FinancialAccount[]>('/financial-accounts/available', params),
  paymentSources: (params: {
    operation: string;
    branch_id?: string;
    amount?: number | string;
    original_financial_account_id?: string | null;
    include_unavailable?: boolean;
  }): Promise<ApiEnvelope<PaymentSource[]>> => get<PaymentSource[]>('/financial-accounts/payment-sources', params),
  transactions: (id: string, params?: ListParams) =>
    get<FinancialAccountTransactionPage>(`/financial-accounts/${id}/transactions`, params),
  revealIdentifier: (id: string) =>
    post<{ id: string; identifier_type?: string | null; identifier_value?: string | null; masked_identifier?: string | null }>(`/financial-accounts/${id}/reveal-identifier`),
  deposit: (id: string, payload: ExternalMovementPayload) =>
    post<FinancialAccountTransaction>(`/financial-accounts/${id}/deposit`, payload),
  withdraw: (id: string, payload: ExternalMovementPayload) =>
    post<FinancialAccountTransaction>(`/financial-accounts/${id}/withdraw`, payload),
  adjust: (id: string, payload: { branch_id: string; direction: 'in' | 'out'; amount: number | string; reason: string; idempotency_key: string }) =>
    post<FinancialAccountTransaction>(`/financial-accounts/${id}/adjust`, payload),
  transfer: (payload: { from_financial_account_id: string; to_financial_account_id: string; branch_id: string; amount: number | string; reference?: string; idempotency_key: string }) =>
    post<FinancialAccountTransaction>('/financial-accounts-transfer', payload),
};
