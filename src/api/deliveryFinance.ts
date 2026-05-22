import type { ListParams } from '@/types/api';
import { get } from './client';

export const deliveryFinanceAPI = {
  dashboard: (params?: ListParams) => get('/delivery-finance/dashboard', params),
  liabilities: (params?: ListParams) => get('/delivery-finance/liabilities', params),
  settlements: (params?: ListParams) => get('/delivery-finance/settlements', params),
  alerts: (params?: ListParams) => get('/delivery-finance/alerts', params),
  driverDetail: (driverId: string, params?: ListParams) => get(`/delivery-finance/drivers/${driverId}`, params),
};
