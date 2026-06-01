import { del, get, postBlob } from './client';

export type ReportQueryParams = Record<string, string | number | boolean | undefined>;

export const reportsAPI = {
  dailySales: (date?: string) => get('/reports/daily-sales', { date }),
  monthlySales: (month?: string) => get('/reports/monthly-sales', { month }),
  salesRange: (fromDate: string, toDate: string) => get('/reports/sales-range', { from_date: fromDate, to_date: toDate }),
  topProducts: (params?: ReportQueryParams) => get('/reports/top-products', params),
  lowStock: () => get('/reports/low-stock'),
  topCustomers: (params?: ReportQueryParams) => get('/reports/top-customers', params),
  profit: (fromDate: string, toDate: string) => get('/reports/profit', { from_date: fromDate, to_date: toDate }),
  debts: () => get('/reports/debts'),
  comprehensiveSales: (params?: ReportQueryParams) => get('/reports/comprehensive-sales', params),
  comprehensivePurchases: (params?: ReportQueryParams) => get('/reports/comprehensive-purchases', params),
  products: (params?: ReportQueryParams) => get('/reports/products', params),
  customers: (params?: ReportQueryParams) => get('/reports/customers', params),
  suppliers: (params?: ReportQueryParams) => get('/reports/suppliers', params),
  employees: (params?: ReportQueryParams) => get('/reports/employees', params),
  payments: (params?: ReportQueryParams) => get('/reports/payments', params),
  profitLoss: (params?: ReportQueryParams) => get('/reports/profit-loss', params),
  inventory: (params?: ReportQueryParams) => get('/reports/inventory', params),
  comprehensive: (params?: ReportQueryParams) => get('/reports/comprehensive', params),
  inventoryValuation: (params?: ReportQueryParams) => get('/reports/inventory/valuation', params),
  salesSummary: (params: { branch_id?: string; from_date: string; to_date: string; group_by?: 'product' | 'category' | 'customer' }) =>
    get('/reports/sales/summary', params),
  salesDashboard: (params: { branch_id?: string; from_date: string; to_date: string }) =>
    get('/reports/sales/dashboard', params),
  treasurySummary: (params?: ReportQueryParams) => get('/reports/treasury/summary', params),
  expensesSummary: (params?: ReportQueryParams) => get('/reports/expenses/summary', params),
  shiftPerformance: (params?: ReportQueryParams) => get('/reports/shifts/performance', params),
  savedList: (params?: ReportQueryParams) => get('/reports/saved', params),
  savedDelete: (id: string) => del(`/reports/saved/${id}`),
  refunds: (params?: ReportQueryParams) => get('/reports/refunds', params),
  salesReturnsByProduct: (params?: ReportQueryParams) => get('/reports/sales-returns-by-product', params),
  purchaseReturnsByProduct: (params?: ReportQueryParams) => get('/reports/purchase-returns-by-product', params),
  tax: (params?: ReportQueryParams) => get('/reports/tax', params),
  layaway: (params?: ReportQueryParams) => get('/reports/layaway', params),
  hourlySales: (params?: ReportQueryParams) => get('/reports/sales/hourly', params),
  stockMovements: (params?: ReportQueryParams) => get('/reports/stock-movements', params),
  rawMaterialStock: (params?: ReportQueryParams) => get('/reports/raw-materials/stock', params),
  lowRawMaterials: (params?: ReportQueryParams) => get('/reports/raw-materials/low-stock', params),
  rawMaterialExpiry: (params?: ReportQueryParams) => get('/reports/raw-materials/expiry', params),
  rawMaterialPurchases: (params?: ReportQueryParams) => get('/reports/raw-materials/purchases', params),
  customerAging: (params?: ReportQueryParams) => get('/reports/customers/aging', params),
  supplierAging: (params?: ReportQueryParams) => get('/reports/suppliers/aging', params),
  coupons: (params?: ReportQueryParams) => get('/reports/coupons', params),
  promotions: (params?: ReportQueryParams) => get('/reports/promotions', params),
  giftCards: (params?: ReportQueryParams) => get('/reports/gift-cards', params),
  dining: (params?: ReportQueryParams) => get('/reports/dining', params),
  delivery: (params?: ReportQueryParams) => get('/reports/delivery', params),
  exportReport: (type: string, format: 'pdf' | 'excel', filters?: ReportQueryParams) => {
    const payload: Record<string, unknown> = { type, format, ...filters };
    if (type === 'products' || type === 'inventory') payload.export_on_hand = 1;
    return postBlob('/reports/export', payload);
  },
};

export type ReportsApiKey = keyof typeof reportsAPI;

export function callReportApi(method: ReportsApiKey, params?: ReportQueryParams) {
  if (method === 'profit' && params?.from_date && params?.to_date) {
    return reportsAPI.profit(String(params.from_date), String(params.to_date));
  }
  if (method === 'salesRange' && params?.from_date && params?.to_date) {
    return reportsAPI.salesRange(String(params.from_date), String(params.to_date));
  }
  const fn = reportsAPI[method] as (p?: ReportQueryParams) => ReturnType<typeof reportsAPI.salesDashboard>;
  return fn(params);
}
