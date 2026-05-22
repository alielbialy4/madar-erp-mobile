import { get, patch, post } from './client';

export type WaiterOrderItem = { product_id: number; quantity: number; notes?: string };

export const waiterAPI = {
  getTables: () => get<Record<string, unknown>[]>('/waiter/tables'),
  createOrder: (data: {
    table_id: string;
    items: WaiterOrderItem[];
    customer_id?: number;
    order_type: 'dine_in' | 'takeaway' | 'delivery';
  }) => post('/waiter/orders', data),
  addToOrder: (orderId: number, items: WaiterOrderItem[]) => post(`/waiter/orders/${orderId}/items`, { items }),
  updateOrderStatus: (orderId: number, status: string) => patch(`/waiter/orders/${orderId}/status`, { status }),
  settleOrder: (
    orderId: number,
    data: { payment_type: 'cash' | 'card' | 'credit' | 'layaway'; paid: number; notes?: string },
  ) => post(`/waiter/orders/${orderId}/settle`, data),
};
