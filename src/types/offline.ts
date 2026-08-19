import type { SalePayload } from '@/types/api';

export type OfflineOrderSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export type OrderTotalsSnapshot = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
};

export type CouponSnapshot = {
  coupon_id: string | null;
  coupon_code?: string | null;
  coupon_discount: number;
};

export type OfflinePosOrderRecord = {
  local_order_id: string;
  /** Idempotent key sent to backend as `client_uuid`. */
  client_order_id: string;
  client_uuid: string;
  branch_id: string;
  shift_id?: string | null;
  pos_register_id?: string | null;
  register_session_id?: string | null;
  cashier_id?: number | null;
  customer_id?: number | null;
  items: SalePayload['items'];
  discounts: { manual?: number; line?: number };
  coupon_snapshot?: CouponSnapshot | null;
  payment_lines: SalePayload['payment_lines'];
  totals_snapshot: OrderTotalsSnapshot;
  payload: SalePayload & { sale_date: string };
  status: OfflineOrderSyncStatus;
  server_sale_id?: number | null;
  server_invoice_number?: string | null;
  error_message?: string | null;
  created_at: string;
  synced_at?: string | null;
};

/** @deprecated Use OfflinePosOrderRecord — kept for gradual migration reads. */
export type LegacyPendingOfflineOrder = SalePayload & {
  client_uuid: string;
  branch_id: string;
  created_at_local: string;
  status: 'pending' | 'failed';
  last_error?: string | null;
};

export type CatalogCacheMeta = {
  saved_at: string;
  updated_at: string;
  branch_id?: string | null;
  catalog: import('@/types/api').PosCatalog;
};

export type KitchenRoutingRule = {
  id: string;
  branch_id: string;
  category_id?: number | null;
  product_id?: number | null;
  printer_profile_id: string;
  copies: number;
  ticket_type: 'kitchen' | 'bar' | 'cashier';
  enabled: boolean;
};
