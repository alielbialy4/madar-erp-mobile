import type { MainTabParamList, MoreStackParamList, ProductsStackParamList } from '@/types/navigation';

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
    endpoint: '/dining-halls',
    status: 'Partial',
    note: 'تجربة النادل في الويب تعتمد على سياق صالة/طاولة. الجوال يفتح شاشة القاعات والطاولات، وهذا المسار يعرض بيانات القاعات كمرجع مقروء.',
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
  '/inventory/warehouses': { endpoint: '/warehouses', status: 'Partial', note: 'المخازن متاحة كقائمة قراءة. إنشاء/تعديل المخازن مؤجل للجوال.' },
  '/inventory/movements': { endpoint: '/inventory/movements', status: 'Complete', note: 'حركات المخزون متاحة كقائمة قراءة مع بحث.' },
  '/inventory/reorder-rules': { endpoint: '/inventory/reorder-rules', status: 'Partial', note: 'قواعد إعادة الطلب متاحة قراءة. التعديل مؤجل لأنه يؤثر على سياسات المخزون.' },
  '/inventory/requisitions': { endpoint: '/inventory/requisitions', status: 'Partial', note: 'طلبات الشراء الداخلية متاحة قراءة. إنشاء/اعتماد الطلبات مؤجل لتفادي سير موافقات غير مكتمل.' },
  '/inventory/stock-counts': { endpoint: '/inventory/stock-counts', status: 'Partial', note: 'الجرد متاح كقائمة قراءة. إنشاء/ترحيل الجرد معطل لحين بناء تدقيق الكميات بالكامل.' },
  '/purchases/returns': { endpoint: '/purchase-returns', status: 'Partial', note: 'مرتجعات الشراء تظهر كقائمة قراءة. الإنشاء متاح من تفاصيل فاتورة شراء عند وضوح البنود.' },
  '/purchases/suppliers': { endpoint: '/purchases/suppliers', status: 'Partial', note: 'موردي المشتريات في الويب مسار متخصص. الجوال يستخدم شاشة الموردين الأساسية مع حالة قراءة لهذا المسار.' },
  '/supplier-payments': {
    endpoint: '/supplier-payments',
    status: 'Partial',
    note: 'دفعات الموردين عملية مالية. القائمة متاحة للقراءة، والإنشاء لا يتم إلا من شاشة مورد مع تأكيد وخزنة.',
  },
  '/drivers': { endpoint: '/drivers', status: 'Partial', note: 'السائقون متاحون كقائمة قراءة. الإنشاء والتعديل مؤجلان للجوال.' },
  '/delivery-zones': { endpoint: '/delivery-zones', status: 'Partial', note: 'مناطق التوصيل متاحة كقائمة قراءة. التعديل مؤجل للجوال.' },
  '/driver-settlements': {
    endpoint: '/driver-settlements',
    status: 'Partial',
    note: 'تسويات السائقين مالية عالية المخاطر؛ تعرض قراءة فقط ولا تنفذ تسوية من الجوال.',
  },
  '/delivery-finance': { endpoint: '/delivery-finance/dashboard', status: 'Partial', note: 'لوحة مالية التوصيل متاحة كبيانات قراءة عند دعم الخادم.' },
  '/delivery-finance/liabilities': { endpoint: '/delivery-finance/liabilities', status: 'Partial', note: 'التزامات التوصيل قراءة فقط.' },
  '/delivery-finance/settlements': { endpoint: '/delivery-finance/settlements', status: 'Partial', note: 'تسويات مالية التوصيل قراءة فقط.' },
  '/delivery-finance/alerts': { endpoint: '/delivery-finance/alerts', status: 'Partial', note: 'تنبيهات مالية التوصيل قراءة فقط.' },
  '/kitchen/print-jobs': { endpoint: '/kitchen/print-jobs', status: 'Partial', note: 'طوابير طباعة المطبخ قراءة فقط في الجوال؛ إدارة الطابعات تبقى على الويب.' },
  '/kitchen/stations': { endpoint: '/kitchen/stations', status: 'Partial', note: 'محطات شاشة المطبخ قراءة فقط في الجوال.' },
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
  '/branches': { endpoint: '/branches', status: 'Partial', note: 'الفروع قراءة فقط في الجوال. تعديل إعدادات الفروع يبقى على الويب.' },
  '/payments': { endpoint: '/payments', status: 'Partial', note: 'المدفوعات مالية؛ تعرض قراءة فقط ولا تنشئ دفعات من هذا المسار.' },
  '/activity-logs': { endpoint: '/activity-logs', status: 'Complete', note: 'سجل النشاط قراءة فقط.' },
  '/backup': {
    status: 'Disabled with reason',
    note: 'النسخ الاحتياطي عملية إدارية عالمية وخطرة. تم تعطيلها في الجوال وتبقى على الويب فقط.',
  },
};

/** Maps web `link` paths from `front/Layouts/buildSidebarMenu.ts` to mobile navigation targets. */
export const WEB_LINK_TO_MOBILE_NAV: Record<string, SidebarNavAction | undefined> = {
  '/': { kind: 'tab', tab: 'DashboardTab' },
  '/pos': { kind: 'tab', tab: 'POSTab' },
  '/products': { kind: 'tab', tab: 'ProductsTab' },
  '/categories': { kind: 'products', screen: 'Categories' },
  '/sales': { kind: 'tab', tab: 'SalesTab' },
  '/sales/returns': { kind: 'more', screen: 'Refunds' },
  '/expenses': { kind: 'more', screen: 'Expenses' },
  '/customers': { kind: 'more', screen: 'Customers' },
  '/dining-halls': { kind: 'more', screen: 'Dining' },
  '/kitchen': { kind: 'more', screen: 'Kitchen' },
  '/inventory': { kind: 'more', screen: 'Inventory' },
  '/inventory/adjustments': { kind: 'more', screen: 'StockAdjustment' },
  '/inventory/transfers': { kind: 'more', screen: 'StockTransfer' },
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
  return action.screen;
}
