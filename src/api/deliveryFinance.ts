import type { ListParams } from '@/types/api';
import { get } from './client';

export type DeliveryFinanceDriverDetail = Record<string, unknown> & {
  driver?: { id?: string | number; name?: string | null; phone?: string | null; branch_name?: string | null; is_active?: boolean | null } | null;
  outstanding?: Record<string, unknown> | null;
  performance?: Record<string, unknown> | null;
  settlement_delay?: Record<string, unknown> | null;
  outstanding_deliveries?: Record<string, unknown>[];
  recent_settlements?: Record<string, unknown>[];
  alerts?: Record<string, unknown>[];
  risk_level?: string | null;
};

export const deliveryFinanceAPI = {
  dashboard: (params?: ListParams) => get('/delivery-finance/dashboard', params),
  liabilities: (params?: ListParams) => get('/delivery-finance/liabilities', params),
  settlements: (params?: ListParams) => get('/delivery-finance/settlements', params),
  alerts: (params?: ListParams) => get('/delivery-finance/alerts', params),
  driverDetail: (driverId: string, params?: ListParams) => get<DeliveryFinanceDriverDetail>(`/delivery-finance/drivers/${driverId}`, params),
};
