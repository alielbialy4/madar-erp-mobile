import type { MainTabParamList, MoreStackParamList, ProductsStackParamList } from '@/types/navigation';
import type { ReportId } from '@/reports/types';

const WEB_REPORT_TO_ID: Record<string, ReportId> = {
  '/reports/sales/dashboard': 'sales-dashboard',
  '/reports/sales/refunds': 'sales-refunds',
  '/reports/sales-returns-by-product': 'sales-returns-by-product',
  '/reports/purchase-returns-by-product': 'purchase-returns-by-product',
  '/reports/sales/tax': 'sales-tax',
  '/reports/sales/layaway': 'sales-layaway',
  '/reports/sales/hourly': 'sales-hourly',
  '/reports/treasury': 'treasury',
  '/reports/expenses': 'expenses',
  '/reports/profit-loss': 'profit-loss-operational',
  '/reports/budget-vs-actual': 'budget-vs-actual',
  '/reports/inventory/valuation': 'inventory-valuation',
  '/reports/inventory/movements': 'inventory-movements',
  '/reports/inventory/expiry': 'inventory-expiry',
  '/reports/inventory/raw-materials': 'raw-materials',
  '/reports/customers/aging': 'customers-aging',
  '/reports/suppliers/aging': 'suppliers-aging',
  '/reports/marketing/coupons': 'marketing-coupons',
  '/reports/marketing/promotions': 'marketing-promotions',
  '/reports/gift-cards': 'gift-cards',
  '/reports/dining': 'dining',
  '/reports/delivery': 'delivery',
  '/reports/shifts': 'shifts',
  '/reports/saved': 'saved-reports',
  '/reports/partner': 'partner-performance',
  '/reports/inventory/stock-counts': 'inventory-stock-counts',
  '/reports/inventory/stock-adjustments': 'inventory-stock-adjustments',
  '/reports/inventory/stock-transfers': 'inventory-stock-transfers',
  '/reports/inventory/warehouse-utilization': 'inventory-warehouse-utilization',
  '/reports/products/variants': 'products-variants',
  '/reports/customers/loyalty': 'customers-loyalty',
  '/reports/customers/wallet': 'customers-wallet',
  '/reports/suppliers/payments': 'suppliers-payments',
  '/reports/suppliers/requisitions': 'suppliers-requisitions',
  '/reports/dining/reservations': 'dining-reservations',
  '/reports/operations/driver-settlements': 'operations-driver-settlements',
  '/reports/operations/cash-drawer': 'operations-cash-drawer',
  '/reports/operations/kitchen-performance': 'operations-kitchen-performance',
  '/reports/operations/offline-sync': 'operations-offline-sync',
  '/reports/expenses/detail': 'expenses-detail',
};

function reportNav(webRoute: string): SidebarNavAction | undefined {
  const reportId = WEB_REPORT_TO_ID[webRoute];
  if (!reportId) return undefined;
  return { kind: 'more', screen: 'ReportViewer', params: { reportId } };
}

export type SidebarNavAction =
  | { kind: 'tab'; tab: keyof MainTabParamList }
  | { kind: 'more'; screen: keyof MoreStackParamList; params?: MoreStackParamList[keyof MoreStackParamList] }
  | { kind: 'products'; screen: keyof ProductsStackParamList; params?: ProductsStackParamList[keyof ProductsStackParamList] };

type ParityStatus = NonNullable<MoreStackParamList['ParityModule']>['status'];

type ParityFallback = {
  endpoint?: string;
  status: ParityStatus;
  note: string;
  searchParam?: 'search' | 'q';
  params?: Record<string, unknown>;
};

const parityFallback = (
  webRoute: string,
  title?: string,
  fallback?: ParityFallback,
): SidebarNavAction => ({
  kind: 'more',
  screen: 'ParityModule',
  params: {
    title: title || webRoute,
    webRoute,
    endpoint: fallback?.endpoint,
    status: fallback?.status ?? 'Disabled with reason',
    note:
      fallback?.note ??
      'تمت مراجعة هذا المسار من الواجهة الحالية. لا توجد شاشة جوال آمنة مكتملة له بعد، لذلك يظهر كمسار مقروء/معطل بدلاً من تنفيذ عملية غير مؤكدة.',
    searchParam: fallback?.searchParam,
    params: fallback?.params,
  },
});

const PARITY_FALLBACKS: Record<string, ParityFallback> = {};

/** Maps web `link` paths from `front/Layouts/buildSidebarMenu.ts` to mobile navigation targets. */
export const WEB_LINK_TO_MOBILE_NAV: Record<string, SidebarNavAction | undefined> = {
  '/': { kind: 'tab', tab: 'DashboardTab' },
  '/pos': { kind: 'tab', tab: 'POSTab' },
  '/products': { kind: 'products', screen: 'ProductsHome' },
  '/raw-materials': { kind: 'products', screen: 'ProductsHome', params: { scope: 'raw_materials' } },
  '/categories': { kind: 'products', screen: 'Categories' },
  '/sales': { kind: 'tab', tab: 'SalesTab' },
  '/sales/products': { kind: 'more', screen: 'SalesByProduct' },
  '/sales/layaway': { kind: 'more', screen: 'Layaway' },
  '/sales/returns': { kind: 'more', screen: 'Refunds' },
  '/expenses': { kind: 'more', screen: 'Expenses' },
  '/customers': { kind: 'more', screen: 'Customers' },
  '/dining-halls': { kind: 'more', screen: 'Dining' },
  '/waiter': { kind: 'more', screen: 'WaiterPos' },
  '/kitchen': { kind: 'more', screen: 'Kitchen' },
  '/kitchen/stations': { kind: 'more', screen: 'KitchenStationsList' },
  '/kitchen/print-jobs': { kind: 'more', screen: 'KitchenPrintJobs' },
  '/kitchen/ticket/:id': { kind: 'more', screen: 'KitchenPrintJobs' },
  '/drivers': { kind: 'more', screen: 'DriversList' },
  '/delivery-zones': { kind: 'more', screen: 'DeliveryZonesList' },
  '/driver-settlements': { kind: 'more', screen: 'DriverSettlements' },
  '/delivery-finance': { kind: 'more', screen: 'DeliveryFinanceDashboard' },
  '/delivery-finance/liabilities': { kind: 'more', screen: 'DeliveryFinanceLiabilities' },
  '/delivery-finance/settlements': { kind: 'more', screen: 'DeliveryFinanceSettlements' },
  '/delivery-finance/alerts': { kind: 'more', screen: 'DeliveryFinanceAlerts' },
  '/delivery-finance/drivers/:driverId': { kind: 'more', screen: 'DeliveryFinanceDriverDetail' },
  '/inventory': { kind: 'more', screen: 'Inventory' },
  '/inventory/balances': { kind: 'more', screen: 'InventoryList', params: { preset: 'balances' } },
  '/inventory/warehouses': { kind: 'more', screen: 'Warehouses' },
  '/inventory/movements': { kind: 'more', screen: 'InventoryList', params: { preset: 'movements' } },
  '/inventory/reorder-rules': { kind: 'more', screen: 'ReorderRulesList' },
  '/inventory/requisitions': { kind: 'more', screen: 'RequisitionsList' },
  '/inventory/stock-counts': { kind: 'more', screen: 'StockCountsList' },
  '/purchases/returns': { kind: 'more', screen: 'PurchaseReturnsList' },
  '/purchases/suppliers': { kind: 'more', screen: 'Suppliers' },
  '/supplier-payments': { kind: 'more', screen: 'SupplierPayments' },
  '/inventory/expiry': { kind: 'more', screen: 'InventoryList', params: { preset: 'expiry' } },
  '/reports/inventory/expiry': reportNav('/reports/inventory/expiry')!,
  '/reports/sales/dashboard': reportNav('/reports/sales/dashboard')!,
  '/reports/sales/refunds': reportNav('/reports/sales/refunds')!,
  '/reports/sales-returns-by-product': reportNav('/reports/sales-returns-by-product')!,
  '/reports/purchase-returns-by-product': reportNav('/reports/purchase-returns-by-product')!,
  '/reports/sales/tax': reportNav('/reports/sales/tax')!,
  '/reports/sales/layaway': reportNav('/reports/sales/layaway')!,
  '/reports/sales/hourly': reportNav('/reports/sales/hourly')!,
  '/reports/treasury': reportNav('/reports/treasury')!,
  '/reports/expenses': reportNav('/reports/expenses')!,
  '/reports/profit-loss': reportNav('/reports/profit-loss')!,
  '/reports/budget-vs-actual': reportNav('/reports/budget-vs-actual')!,
  '/reports/inventory/raw-materials': { kind: 'more', screen: 'RawMaterialsReport' },
  '/reports/inventory/valuation': reportNav('/reports/inventory/valuation')!,
  '/reports/inventory/movements': reportNav('/reports/inventory/movements')!,
  '/reports/customers/aging': reportNav('/reports/customers/aging')!,
  '/reports/suppliers/aging': reportNav('/reports/suppliers/aging')!,
  '/reports/marketing/coupons': reportNav('/reports/marketing/coupons')!,
  '/reports/marketing/promotions': reportNav('/reports/marketing/promotions')!,
  '/reports/gift-cards': reportNav('/reports/gift-cards')!,
  '/reports/dining': reportNav('/reports/dining')!,
  '/reports/delivery': reportNav('/reports/delivery')!,
  '/reports/shifts': reportNav('/reports/shifts')!,
  '/reports/saved': reportNav('/reports/saved')!,
  '/reports/recipes': { kind: 'more', screen: 'RecipeReports' },
  '/reports/legacy': { kind: 'more', screen: 'LegacyReports' },
  '/reports/partner': reportNav('/reports/partner')!,
  '/reports/inventory/stock-counts': reportNav('/reports/inventory/stock-counts')!,
  '/reports/inventory/stock-adjustments': reportNav('/reports/inventory/stock-adjustments')!,
  '/reports/inventory/stock-transfers': reportNav('/reports/inventory/stock-transfers')!,
  '/reports/inventory/warehouse-utilization': reportNav('/reports/inventory/warehouse-utilization')!,
  '/reports/products/variants': reportNav('/reports/products/variants')!,
  '/reports/customers/loyalty': reportNav('/reports/customers/loyalty')!,
  '/reports/customers/wallet': reportNav('/reports/customers/wallet')!,
  '/reports/suppliers/payments': reportNav('/reports/suppliers/payments')!,
  '/reports/suppliers/requisitions': reportNav('/reports/suppliers/requisitions')!,
  '/reports/dining/reservations': reportNav('/reports/dining/reservations')!,
  '/reports/operations/driver-settlements': reportNav('/reports/operations/driver-settlements')!,
  '/reports/operations/cash-drawer': reportNav('/reports/operations/cash-drawer')!,
  '/reports/operations/kitchen-performance': reportNav('/reports/operations/kitchen-performance')!,
  '/reports/operations/offline-sync': reportNav('/reports/operations/offline-sync')!,
  '/reports/expenses/detail': reportNav('/reports/expenses/detail')!,
  '/inventory/adjustments': { kind: 'more', screen: 'StockAdjustmentsList' },
  '/inventory/transfers': { kind: 'more', screen: 'StockTransfersList' },
  '/purchases': { kind: 'more', screen: 'Purchases' },
  '/suppliers': { kind: 'more', screen: 'Suppliers' },
  '/delivery': { kind: 'more', screen: 'Delivery' },
  '/shifts': { kind: 'more', screen: 'ShiftManagement' },
  '/vaults': { kind: 'more', screen: 'Vaults' },
  '/vaults/transactions': { kind: 'more', screen: 'VaultTransactions' },
  '/marketing/promotions': { kind: 'more', screen: 'Promotions' },
  '/marketing/coupons': { kind: 'more', screen: 'Coupons' },
  '/gift-cards': { kind: 'more', screen: 'GiftCards' },
  '/reports': { kind: 'more', screen: 'Reports' },
  '/settings': { kind: 'more', screen: 'Settings' },
  '/employees': { kind: 'more', screen: 'Users' },
  '/payments': { kind: 'more', screen: 'PaymentsLedger' },
  '/branches': { kind: 'more', screen: 'BranchesList' },
  '/activity-logs': { kind: 'more', screen: 'ActivityLogs' },
  '/backup': { kind: 'more', screen: 'BackupInfo' },
  '/barcode-print': { kind: 'more', screen: 'BarcodePrintInfo' },
  '/notifications': { kind: 'more', screen: 'Notifications' },
};

function resolveDynamicWebLink(link: string, label?: string): SidebarNavAction | undefined {
  const driverMatch = link.match(/^\/delivery-finance\/drivers\/([^/]+)$/);
  if (driverMatch) {
    return {
      kind: 'more',
      screen: 'DeliveryFinanceDriverDetail',
      params: { driverId: driverMatch[1], name: label },
    };
  }
  for (const [webRoute, reportId] of Object.entries(WEB_REPORT_TO_ID)) {
    if (link === webRoute) {
      if (reportId === 'raw-materials') {
        return { kind: 'more', screen: 'RawMaterialsReport' };
      }
      return { kind: 'more', screen: 'ReportViewer', params: { reportId } };
    }
  }
  return undefined;
}

export function webLinkToNav(link?: string, label?: string): SidebarNavAction | undefined {
  if (!link) return undefined;
  return WEB_LINK_TO_MOBILE_NAV[link] ?? resolveDynamicWebLink(link, label) ?? parityFallback(link, label, PARITY_FALLBACKS[link]);
}

function stableParamsKey(params: Record<string, unknown> | undefined): string {
  if (!params) return '';
  const keys = Object.keys(params).sort();
  if (keys.length === 0) return '';
  return keys.map((k) => `${k}=${String(params[k])}`).join('&');
}

export function navActionsEqual(a: SidebarNavAction, b: SidebarNavAction): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'tab' && b.kind === 'tab') return a.tab === b.tab;
  if (a.kind === 'products' && b.kind === 'products') {
    return a.screen === b.screen && stableParamsKey(a.params as Record<string, unknown>) === stableParamsKey(b.params as Record<string, unknown>);
  }
  if (a.kind === 'more' && b.kind === 'more') {
    return a.screen === b.screen && stableParamsKey(a.params as Record<string, unknown>) === stableParamsKey(b.params as Record<string, unknown>);
  }
  return false;
}

export function sidebarActionKey(action: SidebarNavAction): string {
  if (action.kind === 'tab') return action.tab;
  if (action.kind === 'products') {
    const scope = (action.params as { scope?: string } | undefined)?.scope;
    return scope ? `ProductsTab:${action.screen}:${scope}` : `ProductsTab:${action.screen}`;
  }

  const { screen, params } = action;
  if (screen === 'ParityModule') {
    const p = params as MoreStackParamList['ParityModule'] | undefined;
    return `ParityModule:${p?.webRoute ?? p?.title ?? 'unknown'}`;
  }
  if (screen === 'ReportViewer') {
    const p = params as MoreStackParamList['ReportViewer'] | undefined;
    return `ReportViewer:${p?.reportId ?? 'unknown'}`;
  }
  if (screen === 'InventoryList') {
    const preset = (params as MoreStackParamList['InventoryList'] | undefined)?.preset;
    if (preset) return `InventoryList:${preset}`;
  }
  const paramKey = stableParamsKey(params as Record<string, unknown> | undefined);
  if (paramKey) return `${screen}:${paramKey}`;
  return screen;
}

export function isNavItemActive(item: { id?: string; nav?: SidebarNavAction }, activeRoute?: string): boolean {
  if (!activeRoute || !item.nav) return false;
  if (item.id === activeRoute) return true;
  return sidebarActionKey(item.nav) === activeRoute;
}
