import type { ListParams } from '@/types/api';
import { del, get, post, put } from './client';

export type PurchasePayload = {
  client_uuid?: string;
  supplier_id: number;
  purchase_date: string;
  items: { product_id: number; quantity: number; cost_price: number; unit_id?: number; production_date?: string; expiry_date?: string; batch_number?: string; variant_id?: string | null }[];
  subtotal: number;
  tax?: number;
  discount?: number;
  paid: number;
  notes?: string;
  warehouse_id?: string | null;
  branch_id?: string | null;
  invoice_number?: string | null;
};

export const purchasesAPI = {
  getAll: (params?: ListParams) => get<Record<string, unknown>[]>('/purchases', params),
  getById: (id: number) => get<Record<string, unknown>>(`/purchases/${id}`),
  create: (data: PurchasePayload) => post('/purchases', data),
  update: (id: number, data: Partial<PurchasePayload>) => put(`/purchases/${id}`, data),
  delete: (id: number) => del(`/purchases/${id}`),
  getPayments: (purchaseId: number) => get(`/purchases/${purchaseId}/payments`),
  addPayment: (purchaseId: number, payload: { amount: number; payment_date: string; vault_id?: string; notes?: string }) =>
    post(`/purchases/${purchaseId}/payments`, payload),
};

export const purchaseReturnsAPI = {
  getAll: (params?: ListParams) => get<Record<string, unknown>[]>('/purchase-returns', params),
  getById: (id: number) => get<Record<string, unknown>>(`/purchase-returns/${id}`),
  getByPurchase: (purchaseId: number) => get<Record<string, unknown>[]>(`/purchases/${purchaseId}/returns`),
  create: (data: { client_uuid?: string; purchase_id: number; items: { purchase_item_id: number; quantity: number }[]; reason?: string; notes?: string }) => post('/purchase-returns', data),
  delete: (id: number) => del(`/purchase-returns/${id}`),
};
