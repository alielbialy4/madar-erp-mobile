import { get, patch, post } from './client';

export type WaiterOrderItem = {
  product_id: number;
  quantity: number;
  unit_price?: number;
  notes?: string;
  variant_id?: string;
  unit_id?: number;
  unit_factor?: number;
  option_ids?: number[];
  selected_options?: {
    product_option_group_id: number;
    option_ids: number[];
  }[];
};

export type WaiterPaymentType = 'cash' | 'card' | 'credit' | 'layaway';

export const waiterAPI = {
  getTables: () => get<Record<string, unknown>[]>('/waiter/tables'),
  showOrder: (orderId: number) => get<Record<string, unknown>>(`/waiter/orders/${orderId}`),
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
    data: { payment_type: WaiterPaymentType; paid: number; notes?: string },
  ) => post(`/waiter/orders/${orderId}/settle`, data),
};
