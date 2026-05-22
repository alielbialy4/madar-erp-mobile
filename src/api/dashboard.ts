import { get } from './client';

export const dashboardAPI = {
  getStatistics: () => get('/dashboard/statistics'),
  getBranchComparison: () => get('/dashboard/branch-comparison'),
  getTreasurySummary: () => get('/dashboard/treasury-summary'),
  getGlobalAnalytics: () => get('/dashboard/global-analytics'),
  getBranchOperational: () => get('/dashboard/branch-operational'),
};
