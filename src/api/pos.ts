import type { PosCatalog, Sale, SalePayload } from '@/types/api';
import type { LegacyPendingOfflineOrder } from '@/types/offline';
import { del, get, post } from './client';

export const posAPI = {
  pullCatalog: (branchId?: string | null, params?: { products_page?: number; products_per_page?: number; customers_limit?: number }) => (
    get<PosCatalog>('/sync/pos-data', { ...(branchId ? { branch_id: branchId } : {}), products_per_page: 300, customers_limit: 500, ...params })
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
  refundSale: (id: number) => post(`/pos/sales/${id}/refund`),
  partialRefund: (saleId: number, data: {
    items: { sale_item_id: number; quantity: number; restock?: boolean }[];
    reason?: string;
    notes?: string;
    refund_method?: 'cash' | 'wallet';
    cash_refund_source?: 'drawer' | 'vault';
  }) => post(`/pos/sales/${saleId}/partial-refund`, data),
  printSale: (id: number) => post(`/pos/sales/${id}/print`),
  holdCart: (data: unknown) => post('/pos/hold-cart', data),
  getHoldCarts: () => get('/pos/hold-carts'),
  restoreCart: (id: number) => post(`/pos/restore-cart/${id}`),
  deleteHoldCart: (id: number) => del(`/pos/hold-cart/${id}`),
};
