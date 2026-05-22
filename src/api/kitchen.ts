import type { KitchenOrder } from '@/types/api';
import { get, patch, post } from './client';

export const kitchenAPI = {
  getOrders: (params?: { status?: string; per_page?: number; station_id?: string }) => get<KitchenOrder[]>('/kitchen/orders', params),
  getOrder: (id: number) => get<KitchenOrder>(`/kitchen/orders/${id}`),
  getStats: () => get('/kitchen/orders/stats'),
  getTicket: (id: number) => get(`/kitchen/orders/${id}/ticket`),
  updateStatus: (orderId: number, status: string) => patch(`/kitchen/orders/${orderId}/status`, { status }),
  bulkUpdateStatus: (orderIds: number[], status: string) => patch('/kitchen/orders/bulk-status', { order_ids: orderIds, status }),
  updateItemStatus: (orderId: number, itemId: number, status: string) => patch(`/kitchen/orders/${orderId}/items/${itemId}/status`, { status }),
  rerouteItem: (orderId: number, itemId: number, payload: { kitchen_station_id?: string | null; reason?: string | null; allow_ready_override?: boolean }) => patch(`/kitchen/orders/${orderId}/items/${itemId}/station`, payload),
  reprintOrder: (saleId: number, payload?: { sale_item_ids?: number[] }) => post(`/kitchen/orders/${saleId}/reprint`, payload ?? {}),
};
