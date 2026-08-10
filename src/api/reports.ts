import { del, get, postBlob } from './client';

export type ReportQueryParams = Record<string, string | number | boolean | (string | number)[] | undefined>;

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
  salesByProduct: (params?: ReportQueryParams) => get('/reports/sales/by-product', params),
  salesProductDetail: (params?: ReportQueryParams) => get('/reports/sales/product-detail', params),
  salesByCategory: (params?: ReportQueryParams) => get('/reports/sales/by-category', params),
  salesCategoryDetail: (params?: ReportQueryParams) => get('/reports/sales/category-detail', params),
  salesDashboard: (params: { branch_id?: string; from_date: string; to_date: string }) =>
    get('/reports/sales/dashboard', params),
  treasurySummary: (params?: ReportQueryParams) => get('/reports/treasury/summary', params),
  expensesSummary: (params?: ReportQueryParams) => get('/reports/expenses/summary', params),
  profitLossOperational: (params?: ReportQueryParams) => get('/reports/profit-loss/operational', params),
  budgetVsActual: (params?: ReportQueryParams) => {
    const next: ReportQueryParams = { ...(params || {}) };
    const from = typeof next.from_date === 'string' ? next.from_date : '';
    const to = typeof next.to_date === 'string' ? next.to_date : '';
    if (from.length >= 4 && to.length >= 4 && from.slice(0, 4) !== to.slice(0, 4)) {
      return Promise.reject({
        response: {
          data: {
            message: 'فترة التقرير يجب أن تكون ضمن سنة ميلادية واحدة',
            errors: { from_date: ['cross_year'] },
          },
          status: 422,
        },
      });
    }
    if (next.year == null && from.length >= 4) {
      next.year = Number(from.slice(0, 4));
    }
    // Only invent month when range is a single calendar month.
    if (next.month == null && from.length >= 7 && to.length >= 7) {
      const sameMonth = from.slice(0, 7) === to.slice(0, 7);
      if (sameMonth) {
        const m = Number(from.slice(5, 7));
        if (m >= 1 && m <= 12) next.month = m;
      }
    }
    return get('/reports/budget-vs-actual', next);
  },
  shiftPerformance: (params?: ReportQueryParams) => get('/reports/shifts/performance', params),
  savedList: (params?: ReportQueryParams) => get('/reports/saved', params),
  savedDelete: (id: string) => del(`/reports/saved/${id}`),
  refunds: (params?: ReportQueryParams) => get('/reports/refunds', params),
  salesReturnsByProduct: (params?: ReportQueryParams) => get('/reports/sales-returns-by-product', params),
  salesReturnsByCategory: (params?: ReportQueryParams) => get('/reports/sales-returns-by-category', params),
  purchaseReturnsByProduct: (params?: ReportQueryParams) => get('/reports/purchase-returns-by-product', params),
  purchaseReturnsByCategory: (params?: ReportQueryParams) => get('/reports/purchase-returns-by-category', params),
  tax: (params?: ReportQueryParams) => get('/reports/tax', params),
  layaway: (params?: ReportQueryParams) => get('/reports/layaway', params),
  hourlySales: (params?: ReportQueryParams) => get('/reports/sales/hourly', params),
  stockMovements: (params?: ReportQueryParams) => get('/reports/stock-movements', params),
  /** Unified raw materials report — pass `tab`: stock | low | expiry | purchases */
  rawMaterialsReport: (params?: ReportQueryParams) => get('/reports/raw-materials', params),
  /** Unified recipes report — pass `tab`: consumption | cost | missing | negative | variance | finished_goods */
  recipesReport: (params?: ReportQueryParams) => get('/reports/recipes', params),
  /** Unified inventory movements report */
  inventoryMovements: (params?: ReportQueryParams) => get('/reports/inventory/movements', params),
  /** Unified inventory expiry report */
  inventoryExpiry: (params?: ReportQueryParams) => get('/reports/inventory/expiry', params),
  /** @deprecated Use rawMaterialsReport with tab=stock */
  rawMaterialStock: (params?: ReportQueryParams) => get('/reports/raw-materials/stock', params),
  /** @deprecated Use rawMaterialsReport with tab=low */
  lowRawMaterials: (params?: ReportQueryParams) => get('/reports/raw-materials/low-stock', params),
  /** @deprecated Use rawMaterialsReport with tab=expiry */
  rawMaterialExpiry: (params?: ReportQueryParams) => get('/reports/raw-materials/expiry', params),
  /** @deprecated Use rawMaterialsReport with tab=purchases */
  rawMaterialPurchases: (params?: ReportQueryParams) => get('/reports/raw-materials/purchases', params),
  customerAging: (params?: ReportQueryParams) => get('/reports/customers/aging', params),
  supplierAging: (params?: ReportQueryParams) => get('/reports/suppliers/aging', params),
  coupons: (params?: ReportQueryParams) => get('/reports/coupons', params),
  promotions: (params?: ReportQueryParams) => get('/reports/promotions', params),
  giftCards: (params?: ReportQueryParams) => get('/reports/gift-cards', params),
  dining: (params?: ReportQueryParams) => get('/reports/dining', params),
  delivery: (params?: ReportQueryParams) => get('/reports/delivery', params),
  recipeConsumption: (params?: ReportQueryParams) => get('/reports/recipes/consumption', params),
  recipeCosts: (params?: ReportQueryParams) => get('/reports/recipes/costs', params),
  recipeMissing: (params?: ReportQueryParams) => get('/reports/recipes/missing', params),
  recipeNegativeIngredients: (params?: ReportQueryParams) => get('/reports/recipes/negative-ingredients', params),
  recipeVariance: (params?: ReportQueryParams) => get('/reports/recipes/variance', params),
  recipeFinishedGoods: (params?: ReportQueryParams) => get('/reports/recipes/finished-goods', params),
  stockCounts: (params?: ReportQueryParams) => get('/reports/stock-counts', params),
  stockAdjustments: (params?: ReportQueryParams) => get('/reports/stock-adjustments', params),
  stockTransfers: (params?: ReportQueryParams) => get('/reports/stock-transfers', params),
  warehouseUtilization: (params?: ReportQueryParams) => get('/reports/warehouse-utilization', params),
  productVariants: (params?: ReportQueryParams) => get('/reports/product-variants', params),
  loyalty: (params?: ReportQueryParams) => get('/reports/loyalty', params),
  wallet: (params?: ReportQueryParams) => get('/reports/wallet', params),
  supplierPaymentsDetail: (params?: ReportQueryParams) => get('/reports/supplier-payments', params),
  purchaseRequisitions: (params?: ReportQueryParams) => get('/reports/purchase-requisitions', params),
  tableReservations: (params?: ReportQueryParams) => get('/reports/table-reservations', params),
  driverSettlements: (params?: ReportQueryParams) => get('/reports/driver-settlements', params),
  cashDrawer: (params?: ReportQueryParams) => get('/reports/cash-drawer', params),
  kitchenPerformance: (params?: ReportQueryParams) => get('/reports/kitchen-performance', params),
  offlineSync: (params?: ReportQueryParams) => get('/reports/offline-sync', params),
  posDeviceSyncManifest: (params?: ReportQueryParams) => get('/reports/pos-device-sync-manifest', params),
  drawerReconciliation: (params?: ReportQueryParams) => get('/reports/drawer-reconciliation', params),
  expensesReport: (params?: ReportQueryParams) => get('/reports/expenses', params),
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
