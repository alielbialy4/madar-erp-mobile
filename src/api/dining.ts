import type { DiningHall, DiningTable, SalePayload } from '@/types/api';
import { del, get, patch, post, put } from './client';

export interface TableOrderDraftItem {
  product_id: number;
  quantity: number;
  unit_id?: number | null;
  unit_price: number;
  discount?: number;
  variant_id?: string | null;
  selected_options?: { product_option_group_id: number; option_ids: number[] }[];
  client_cart_line_id?: string | null;
  kitchen_route_type?: 'screen' | 'printer' | 'none' | null;
  kitchen_station_id?: string | null;
  kitchen_printer_id?: string | null;
  kitchen_printed_quantity?: number;
  kitchen_printed_at?: string | null;
}

export interface TableOrderDraftPayload {
  expected_sale_updated_at?: string | null;
  items: TableOrderDraftItem[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  promotion_discount?: number;
  coupon_id?: string | null;
  coupon_discount?: number;
  total?: number;
  customer_id?: number | null;
  notes?: string | null;
}

export const diningAPI = {
  listHalls: (branchId: string) => get<DiningHall[]>(`/branches/${branchId}/dining-halls`, undefined, { 'X-Branch-Id': branchId }),
  listHallsForPos: (branchId: string) => get<DiningHall[]>('/pos/dining-halls', undefined, { 'X-Branch-Id': branchId }),
  getHall: (id: string) => get<DiningHall>(`/dining-halls/${id}`),
  listTablesForHall: (hallId: string) => get<DiningTable[]>(`/dining-halls/${hallId}/tables`),
  listTablesForBranch: (branchId: string, status?: string) => get<{ tables: DiningTable[]; status_counts?: Record<string, number> }>('/pos/tables', status ? { status } : undefined, { 'X-Branch-Id': branchId }),
  getTable: (tableId: string) => get(`/tables/${tableId}`),
  getActiveOrder: (tableId: string) => get(`/pos/tables/${tableId}/order`),
  syncOrderDraft: (tableId: string, payload: TableOrderDraftPayload) => put(`/pos/tables/${tableId}/order/draft`, payload),
  settleOrder: (tableId: string, payload: Partial<SalePayload> & { client_op_id?: string }) => post(`/pos/tables/${tableId}/order/settle`, payload),
  transferOrder: (sourceTableId: string, targetTableId: string) => post(`/pos/tables/${sourceTableId}/transfer`, { target_table_id: targetTableId }),
  mergeOrder: (sourceTableId: string, targetTableId: string) => post(`/pos/tables/${sourceTableId}/merge`, { target_table_id: targetTableId }),
  unmergeOrder: (targetTableId: string, sourceTableId: string) =>
    post(`/pos/tables/${targetTableId}/unmerge`, { source_table_id: sourceTableId }),
  releaseForPos: (tableId: string) => post(`/pos/tables/${tableId}/release`),
  updateTableStatus: (tableId: string, status: string) => patch(`/tables/${tableId}/status`, { status }),
  deleteTable: (tableId: string) => del(`/tables/${tableId}`),
  createHall: (branchId: string, payload: Record<string, unknown>) =>
    post(`/branches/${branchId}/dining-halls`, payload, { 'X-Branch-Id': branchId }),
  updateHall: (id: string, payload: Record<string, unknown>) => put(`/dining-halls/${id}`, payload),
  deleteHall: (id: string) => del(`/dining-halls/${id}`),
};
