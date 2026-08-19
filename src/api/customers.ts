import type { Customer, CustomerAddress, ListParams } from '@/types/api';
import { del, get, post, put } from './client';

export type CustomerPayload = {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  branch_id?: string;
  credit_limit?: number | null;
  additional_phones?: { phone: string; label?: string; notes?: string }[];
};

export type CustomerOpenDebts = {
  layaway_plans: { id: string; invoice_number?: string | null; remaining: number; next_due_date?: string | null }[];
  credit_sales: { id: number; invoice_number?: string | null; remaining: number; sale_date?: string | null }[];
};

export const customersAPI = {
  getAll: (params?: ListParams) => get<Customer[]>('/customers', params),
  getById: (id: number) => get<Customer>(`/customers/${id}`),
  create: (data: CustomerPayload) => post<Customer>('/customers', data),
  update: (id: number, data: Partial<CustomerPayload>) => put<Customer>(`/customers/${id}`, data),
  delete: (id: number) => del(`/customers/${id}`),
  getSales: (id: number, params?: ListParams) => get(`/customers/${id}/sales`, params),
  getDeliveries: (id: number, params?: ListParams) => get(`/customers/${id}/deliveries`, params),
  getPaymentHistory: (id: number) => get<{
    id: number;
    amount: number;
    type: string;
    entry_type: string;
    payment_method?: string | null;
    payment_date?: string | null;
    notes?: string | null;
    sale_id?: number | null;
    invoice_number?: string | null;
    vault_name?: string | null;
    created_at?: string | null;
  }[]>(`/customers/${id}/history`),
  getLoyaltyTransactions: (id: number, params?: ListParams) => get(`/customers/${id}/loyalty-transactions`, params),
  getAddresses: (id: number) => get<CustomerAddress[]>(`/customers/${id}/addresses`),
  addAddress: (id: number, payload: Partial<CustomerAddress>) => post(`/customers/${id}/addresses`, payload),
  lookupForPos: (phone: string) => get('/pos/customers/lookup', { phone }),
  quickCreateForPos: (payload: CustomerPayload & { address?: Record<string, unknown> }) => post('/pos/customers/quick-create', payload),
  getOpenDebts: (id: number) => get<CustomerOpenDebts>(`/customers/${id}/open-debts`),
  recordDebtPayment: (
    id: number,
    payload: {
      amount: number;
      payment_method: string;
      financial_account_id?: string | null;
      vault_id?: string | null;
      sale_id?: number | null;
      notes?: string;
      idempotency_key?: string;
    },
  ) => post(`/customers/${id}/debt-payments`, payload),
};
