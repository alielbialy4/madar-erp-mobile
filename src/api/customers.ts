import type { Customer, CustomerAddress, ListParams } from '@/types/api';
import { del, get, post, put } from './client';

export type CustomerPayload = {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  branch_id?: string;
  additional_phones?: { phone: string; label?: string; notes?: string }[];
};

export const customersAPI = {
  getAll: (params?: ListParams) => get<Customer[]>('/customers', params),
  getById: (id: number) => get<Customer>(`/customers/${id}`),
  create: (data: CustomerPayload) => post<Customer>('/customers', data),
  update: (id: number, data: Partial<CustomerPayload>) => put<Customer>(`/customers/${id}`, data),
  delete: (id: number) => del(`/customers/${id}`),
  getSales: (id: number, params?: ListParams) => get(`/customers/${id}/sales`, params),
  getDeliveries: (id: number, params?: ListParams) => get(`/customers/${id}/deliveries`, params),
  getPaymentHistory: (id: number) => get(`/customers/${id}/history`),
  getLoyaltyTransactions: (id: number, params?: ListParams) => get(`/customers/${id}/loyalty-transactions`, params),
  getAddresses: (id: number) => get<CustomerAddress[]>(`/customers/${id}/addresses`),
  addAddress: (id: number, payload: Partial<CustomerAddress>) => post(`/customers/${id}/addresses`, payload),
  lookupForPos: (phone: string) => get('/pos/customers/lookup', { phone }),
  quickCreateForPos: (payload: CustomerPayload & { address?: Record<string, unknown> }) => post('/pos/customers/quick-create', payload),
};
