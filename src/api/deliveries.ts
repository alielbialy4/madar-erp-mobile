import type { ListParams } from '@/types/api';
import { get, patch, post } from './client';

export type DeliveryStatusPayload = {
  status: string;
  notes?: string;
  collected_amount?: number;
  collection_note?: string;
  partial_collection_waiver?: boolean;
};

export type DeliveryTrackingItem = Record<string, unknown> & {
  id: string;
  sale_id?: number;
  status: string;
  wait_minutes?: number;
  delivery_fee?: number | string;
  amount_to_collect?: number | string;
  collected_amount?: number | string;
  collection_method?: string;
  collection_status?: string;
  customer_phone?: string | null;
  delivery_address?: string | null;
  created_at?: string;
  sale?: {
    invoice_number?: string | null;
    total?: number | string;
    customer?: { name?: string | null } | null;
  } | null;
  driver?: { name?: string | null } | null;
  delivery_zone?: { name?: string | null } | null;
};

export type DeliveryTrackingSummary = {
  pending: number;
  assigned: number;
  picked_up: number;
  in_transit: number;
  active_total: number;
  delivered_today: number;
  failed_today: number;
  returned_today: number;
  total_fees_today: number;
  total_collected_today: number;
  avg_wait_minutes_pending: number;
  overdue_pending: number;
};

export type DeliveryTrackingResponse = {
  summary: DeliveryTrackingSummary;
  lanes: {
    pending: DeliveryTrackingItem[];
    assigned: DeliveryTrackingItem[];
    picked_up: DeliveryTrackingItem[];
    in_transit: DeliveryTrackingItem[];
  };
  completed_recent: DeliveryTrackingItem[];
};

export const deliveriesAPI = {
  getAll: (params?: ListParams) => get('/deliveries', params),
  getById: (id: string) => get(`/deliveries/${id}`),
  assignDriver: (id: string, driverId: string) => post(`/deliveries/${id}/assign`, { driver_id: driverId }),
  updateStatus: (id: string, payload: DeliveryStatusPayload) => patch(`/deliveries/${id}/status`, payload),
  tracking: (params?: ListParams) => get<DeliveryTrackingResponse>('/deliveries/tracking', params),
  getToday: (params?: ListParams) => get('/deliveries/today', params),
};
