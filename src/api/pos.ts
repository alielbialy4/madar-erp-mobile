import type { PosCatalog, Sale, SalePayload } from '@/types/api';
import type { LegacyPendingOfflineOrder } from '@/types/offline';
import { del, get, post } from './client';

export type RefundPreview = {
  total: number;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  refund_base_total: number;
  loyalty_value_restored: number;
  loyalty_points_restored: number;
  service_charge_refunded: number;
  service_charge_retained: number;
  non_reserving_preview: boolean;
};

export const posAPI = {
  pullCatalog: (branchId?: string | null, params?: { products_page?: number; products_per_page?: number; customers_limit?: number; price_defining_options_version?: number }) => (
    get<PosCatalog>('/sync/pos-data', { ...(branchId ? { branch_id: branchId } : {}), products_per_page: 300, customers_limit: 500, ...params, price_defining_options_version: 1 })
  ),
  pushOfflineOrders: (orders: (LegacyPendingOfflineOrder & { sale_date: string })[], branchId?: string | null) => (
    post<
      {
        client_uuid: string;
        status: 'created' | 'duplicate' | 'error';
        sale_id?: number;
        invoice_number?: string | null;
        print_sequence?: number | null;
        message?: string;
      }[]
    >('/sync/offline-orders', { orders }, branchId ? { 'X-Branch-Id': branchId } : undefined)
  ),
  createSale: (data: SalePayload) => post<Sale>('/pos/sales', data),
  getSales: (params?: Record<string, unknown>) => get<Sale[]>('/pos/sales', params),
  getSale: (id: number) => get<Sale>(`/pos/sales/${id}`),
  timeline: (id: number) => get<{ sale_id?: number; invoice_number?: string | null; events?: Record<string, unknown>[] }>(`/pos/sales/${id}/timeline`),
  refundSale: (id: number, data?: { client_uuid?: string }) => post(`/pos/sales/${id}/refund`, data),
  partialRefund: (saleId: number, data: {
    client_uuid?: string;
    items: { sale_item_id: number; quantity: number; restock?: boolean }[];
    reason?: string;
    notes?: string;
    refund_method?: 'cash' | 'wallet' | 'original_account' | 'alternative_account';
    cash_refund_source?: 'drawer' | 'vault';
    refund_vault_id?: string;
    refund_financial_account_id?: string;
    refund_channel?: 'cash' | 'card' | 'instapay' | 'electronic_wallet' | 'vodafone_cash' | 'bank_transfer' | 'payment_gateway';
    alternative_refund_reason?: string;
  }) => post(`/pos/sales/${saleId}/partial-refund`, data),
  previewPartialRefund: (saleId: number, items: { sale_item_id: number; quantity: number }[]) =>
    post<RefundPreview>(`/pos/sales/${saleId}/partial-refund/preview`, { items }),
  printSale: (id: number) => post(`/pos/sales/${id}/print`),
  printSaleRaw: (path: string) => post(path),
  holdCart: (data: unknown) => post('/pos/hold-cart', data),
  getHoldCarts: () => get('/pos/hold-carts'),
  restoreCart: (id: number) => post(`/pos/restore-cart/${id}`),
  deleteHoldCart: (id: number) => del(`/pos/hold-cart/${id}`),
};
