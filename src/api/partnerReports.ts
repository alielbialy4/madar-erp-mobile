import { get } from './client';
import type { ReportQueryParams } from './reports';

export type PartnerPerformanceParams = {
  start_date?: string;
  end_date?: string;
  branch_ids?: string;
};

export const partnerReportsAPI = {
  getPerformance: (params?: PartnerPerformanceParams) =>
    get('/reports/partner/performance', params as ReportQueryParams),
};
