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
  '/reports/inventory/valuation': 'inventory-valuation',
  '/reports/inventory/movements': 'inventory-movements',
  '/reports/inventory/expiry': 'inventory-expiry',
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

const PARITY_FALLBACKS: Record<string, ParityFallback> = {
  '/waiter': {
    endpoint: '/waiter/tables',
    status: 'Complete',
    note: 'وضع النادل: اختيار طاولة، إضافة أصناف، إرسال للمطبخ، تحصيل لاحق.',
  },
  '/sales/products': {
    endpoint: '/reports/sales/summary',
    status: 'Partial',
    note: 'يعرض الويب مبيعات المنتجات كتقرير تفصيلي. الجوال يوفر قراءة ملخصة من endpoint التقارير عند توفر النطاق الزمني في الخادم.',
  },
  '/sales/layaway': {
    endpoint: '/layaway',
    status: 'Partial',
    note: 'قائمة البيع الآجل متاحة للقراءة. إضافة دفعات الأقساط مؤجلة للجوال لأنها عملية مالية وتحتاج تحقق خزنة كامل.',
  },
  '/inventory/balances': { endpoint: '/inventory/balances', status: 'Complete', note: 'قائمة أرصدة المخزون مطابقة كقائمة بطاقات مع بحث.' },
  '/inventory/warehouses': { endpoint: '/warehouses', status: 'Complete', note: 'قائمة المخازن مع عرض وتفاصيل وإضافة/تعديل/حذف (الوضع العام).' },
  '/inventory/movements': { endpoint: '/inventory/movements', status: 'Complete', note: 'حركات المخزون متاحة كقائمة قراءة مع بحث.' },
  '/inventory/reorder-rules': { endpoint: '/inventory/reorder-rules', status: 'Complete', note: 'قواعد إعادة الطلب: قائمة وإنشاء/تعديل عبر شاشة النموذج.' },
  '/inventory/requisitions': { endpoint: '/inventory/requisitions', status: 'Complete', note: 'طلبات داخلية: إنشاء وتغيير الحالة (اعتماد/تنفيذ) مع تأكيد.' },
  '/inventory/stock-counts': { endpoint: '/inventory/stock-counts', status: 'Complete', note: 'جلسات الجرد: إنشاء، إضافة بنود، حفظ، وترحيل مع تأكيد.' },
  '/purchases/returns': { endpoint: '/purchase-returns', status: 'Complete', note: 'قائمة مرتجعات الشراء وتفاصيلها؛ الإنشاء من فاتورة الشراء.' },
  '/purchases/suppliers': { endpoint: '/purchases/suppliers', status: 'Partial', note: 'موردي المشتريات في الويب مسار متخصص. الجوال يستخدم شاشة الموردين الأساسية مع حالة قراءة لهذا المسار.' },
  '/supplier-payments': {
    endpoint: '/supplier-payments',
    status: 'Partial',
    note: 'دفعات الموردين: الإنشاء من تفاصيل المورد مع تأكيد وخزنة. لا توجد قائمة مستقلة — استخدم الموردين.',
  },
  '/drivers': { endpoint: '/drivers', status: 'Complete', note: 'قائمة السائقين وإنشاء/تعديل.' },
  '/delivery-zones': { endpoint: '/delivery-zones', status: 'Complete', note: 'مناطق التوصيل ورسومها.' },
  '/driver-settlements': {
    endpoint: '/driver-settlements',
    status: 'Disabled with reason',
    note: 'قائمة تسويات السائقين للقراءة. الإنشاء معطّل على الجوال (خزنة + طلبات متعددة).',
  },
  '/delivery-finance': { endpoint: '/delivery-finance/dashboard', status: 'Complete', note: 'لوحة مالية التوصيل.' },
  '/delivery-finance/liabilities': { endpoint: '/delivery-finance/liabilities', status: 'Complete', note: 'التزامات التوصيل قراءة.' },
  '/delivery-finance/settlements': { endpoint: '/delivery-finance/settlements', status: 'Complete', note: 'سجل تسويات مالية قراءة.' },
  '/delivery-finance/alerts': { endpoint: '/delivery-finance/alerts', status: 'Complete', note: 'تنبيهات مالية التوصيل.' },
  '/kitchen/print-jobs': { endpoint: '/kitchen-print-jobs', status: 'Complete', note: 'طابور الطباعة مع إعادة محاولة للفاشلة.' },
  '/kitchen/stations': { endpoint: '/kitchen-stations', status: 'Complete', note: 'محطات KDS وCRUD.' },
  '/vaults/transactions': {
    endpoint: '/vaults/transactions',
    status: 'Partial',
    note: 'حركات الخزن مالية؛ تظهر قراءة فقط، والإيداع/السحب محميان بتأكيد داخل شاشة الخزن.',
  },
  '/reports/sales/dashboard': { endpoint: '/reports/sales/dashboard', status: 'Complete', note: 'تقرير لوحة المبيعات قراءة مع بطاقات ملخصة.' },
  '/reports/sales/refunds': { endpoint: '/reports/refunds', status: 'Complete', note: 'تقرير المرتجعات قراءة.' },
  '/reports/sales-returns-by-product': { endpoint: '/reports/sales-returns-by-product', status: 'Partial', note: 'تقرير مرتجعات البيع بالمنتج قراءة عند توفر endpoint.' },
  '/reports/purchase-returns-by-product': { endpoint: '/reports/purchase-returns-by-product', status: 'Partial', note: 'تقرير مرتجعات الشراء بالمنتج قراءة عند توفر endpoint.' },
  '/reports/sales/tax': { endpoint: '/reports/tax', status: 'Complete', note: 'تقرير الضرائب قراءة.' },
  '/reports/sales/layaway': { endpoint: '/reports/layaway', status: 'Partial', note: 'تقرير البيع الآجل قراءة عند توفر endpoint.' },
  '/reports/sales/hourly': { endpoint: '/reports/sales/hourly', status: 'Partial', note: 'تقرير المبيعات بالساعة قراءة عند توفر endpoint.' },
  '/reports/treasury': { endpoint: '/reports/treasury/summary', status: 'Complete', note: 'تقرير الخزائن قراءة.' },
  '/reports/expenses': { endpoint: '/reports/expenses/summary', status: 'Complete', note: 'تقرير المصروفات قراءة.' },
  '/reports/inventory/valuation': { endpoint: '/reports/inventory/valuation', status: 'Complete', note: 'تقييم المخزون قراءة.' },
  '/reports/inventory/movements': { endpoint: '/reports/stock-movements', status: 'Complete', note: 'تقرير حركات المخزون قراءة.' },
  '/reports/inventory/expiry': { endpoint: '/inventory/expiry-stock', status: 'Complete', note: 'تقرير الصلاحية قراءة.' },
  '/reports/customers/aging': { endpoint: '/reports/customers/aging', status: 'Complete', note: 'أعمار ديون العملاء قراءة.' },
  '/reports/suppliers/aging': { endpoint: '/reports/suppliers/aging', status: 'Complete', note: 'أعمار الموردين قراءة.' },
  '/reports/marketing/coupons': { endpoint: '/reports/coupons', status: 'Complete', note: 'تقرير الكوبونات قراءة.' },
  '/reports/marketing/promotions': { endpoint: '/reports/promotions', status: 'Partial', note: 'تقرير العروض قراءة عند توفر endpoint.' },
  '/reports/gift-cards': { endpoint: '/reports/gift-cards', status: 'Partial', note: 'تقرير بطاقات الهدايا قراءة عند توفر endpoint.' },
  '/reports/dining': { endpoint: '/reports/dining', status: 'Complete', note: 'تقرير المطاعم قراءة.' },
  '/reports/delivery': { endpoint: '/reports/delivery', status: 'Complete', note: 'تقرير التوصيل قراءة.' },
  '/reports/shifts': { endpoint: '/reports/shifts/performance', status: 'Complete', note: 'أداء الورديات قراءة.' },
  '/reports/saved': { endpoint: '/reports/saved', status: 'Partial', note: 'التقارير المحفوظة قراءة عند توفر endpoint.' },
  '/reports/legacy': { endpoint: '/reports', status: 'Partial', note: 'التقارير الكلاسيكية متاحة كقائمة/ملخص قراءة.' },
  '/branches': { endpoint: '/branches', status: 'Complete', note: 'قائمة الفروع وإعدادات POS/ضريبة لكل فرع.' },
  '/payments': { endpoint: '/payments', status: 'Partial', note: 'المدفوعات مالية؛ تعرض قراءة فقط ولا تنشئ دفعات من هذا المسار.' },
  '/activity-logs': { endpoint: '/activity-logs', status: 'Complete', note: 'سجل النشاط قراءة فقط.' },
  '/backup': {
    status: 'Disabled with reason',
    note: 'النسخ الاحتياطي على الويب فقط — شاشة الجوال توضح السبب (BackupInfo).',
  },
};

/** Maps web `link` paths from `front/Layouts/buildSidebarMenu.ts` to mobile navigation targets. */
export const WEB_LINK_TO_MOBILE_NAV: Record<string, SidebarNavAction | undefined> = {
  '/': { kind: 'tab', tab: 'DashboardTab' },
  '/pos': { kind: 'tab', tab: 'POSTab' },
  '/products': { kind: 'products', screen: 'ProductsHome' },
  '/categories': { kind: 'products', screen: 'Categories' },
  '/sales': { kind: 'tab', tab: 'SalesTab' },
  '/sales/returns': { kind: 'more', screen: 'Refunds' },
  '/expenses': { kind: 'more', screen: 'Expenses' },
  '/customers': { kind: 'more', screen: 'Customers' },
  '/dining-halls': { kind: 'more', screen: 'Dining' },
  '/waiter': { kind: 'more', screen: 'WaiterPos' },
  '/kitchen': { kind: 'more', screen: 'Kitchen' },
  '/kitchen/stations': { kind: 'more', screen: 'KitchenStationsList' },
  '/kitchen/print-jobs': { kind: 'more', screen: 'KitchenPrintJobs' },
  '/drivers': { kind: 'more', screen: 'DriversList' },
  '/delivery-zones': { kind: 'more', screen: 'DeliveryZonesList' },
  '/driver-settlements': { kind: 'more', screen: 'DriverSettlements' },
  '/delivery-finance': { kind: 'more', screen: 'DeliveryFinanceDashboard' },
  '/delivery-finance/liabilities': { kind: 'more', screen: 'DeliveryFinanceLiabilities' },
  '/delivery-finance/settlements': { kind: 'more', screen: 'DeliveryFinanceSettlements' },
  '/delivery-finance/alerts': { kind: 'more', screen: 'DeliveryFinanceAlerts' },
  '/inventory': { kind: 'more', screen: 'Inventory' },
  '/inventory/balances': { kind: 'more', screen: 'InventoryList', params: { preset: 'balances' } },
  '/inventory/warehouses': { kind: 'more', screen: 'Warehouses' },
  '/inventory/movements': { kind: 'more', screen: 'InventoryList', params: { preset: 'movements' } },
  '/inventory/reorder-rules': { kind: 'more', screen: 'ReorderRulesList' },
  '/inventory/requisitions': { kind: 'more', screen: 'RequisitionsList' },
  '/inventory/stock-counts': { kind: 'more', screen: 'StockCountsList' },
  '/purchases/returns': { kind: 'more', screen: 'PurchaseReturnsList' },
  '/supplier-payments': { kind: 'more', screen: 'Suppliers' },
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
  '/reports/legacy': { kind: 'more', screen: 'LegacyReports' },
  '/reports/partner': reportNav('/reports/partner')!,
  '/inventory/adjustments': { kind: 'more', screen: 'StockAdjustmentsList' },
  '/inventory/transfers': { kind: 'more', screen: 'StockTransfersList' },
  '/purchases': { kind: 'more', screen: 'Purchases' },
  '/suppliers': { kind: 'more', screen: 'Suppliers' },
  '/delivery': { kind: 'more', screen: 'Delivery' },
  '/shifts': { kind: 'more', screen: 'ShiftManagement' },
  '/vaults': { kind: 'more', screen: 'Vaults' },
  '/marketing/promotions': { kind: 'more', screen: 'Promotions' },
  '/marketing/coupons': { kind: 'more', screen: 'Coupons' },
  '/gift-cards': { kind: 'more', screen: 'GiftCards' },
  '/reports': { kind: 'more', screen: 'Reports' },
  '/settings': { kind: 'more', screen: 'Settings' },
  '/employees': { kind: 'more', screen: 'Users' },
  '/branches': { kind: 'more', screen: 'BranchesList' },
  '/activity-logs': { kind: 'more', screen: 'ActivityLogs' },
  '/backup': { kind: 'more', screen: 'BackupInfo' },
};

export function webLinkToNav(link?: string, label?: string): SidebarNavAction | undefined {
  if (!link) return undefined;
  return WEB_LINK_TO_MOBILE_NAV[link] ?? parityFallback(link, label, PARITY_FALLBACKS[link]);
}

export function sidebarActionKey(action: SidebarNavAction): string {
  if (action.kind === 'tab') return action.tab;
  if (action.kind === 'products') return `ProductsTab:${action.screen}`;
  if (action.screen === 'ParityModule') {
    const params = action.params as MoreStackParamList['ParityModule'] | undefined;
    return `ParityModule:${params?.webRoute ?? params?.title ?? 'unknown'}`;
  }
  if (action.screen === 'ReportViewer') {
    const params = action.params as MoreStackParamList['ReportViewer'] | undefined;
    return `ReportViewer:${params?.reportId ?? 'unknown'}`;
  }
  return action.screen;
}
