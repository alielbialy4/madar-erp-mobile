/**
 * Sidebar menu builder — mirrored from `front/src/Layouts/buildSidebarMenu.ts`.
 * Web paths are mapped to mobile navigation via `sidebarNavMap.ts`.
 */

import { webLinkToNav, type SidebarNavAction } from './sidebarNavMap';

type PlanFeatureKey = string;

export type SidebarMenuItem = {
 id?: string
 label: string
 icon?: string
 link?: string
 type?: 'section'
 /** Single permission, or OR-list (matches `PermissionGuard` behavior). */
 perm?: string | string[]
 preload?: string
 subItems?: SidebarMenuItem[]
 branchOnly?: boolean
 globalOnly?: boolean
 /** SaaS plan feature key — hidden when not included in tenant plan. */
 feature?: PlanFeatureKey
}

type HasPermission = (permission: string) => boolean

type ViewMode = 'global' | 'branch'

type HasFeature = (feature: PlanFeatureKey) => boolean

function normalizeViewMode(viewMode?: string): ViewMode {
 return viewMode === 'global' ? 'global' : 'branch'
}

function permAllows(
 isSuperAdmin: boolean,
 hasPermission: HasPermission,
 perm?: string | string[],
): boolean {
 if (isSuperAdmin) return true
 if (perm === undefined) return true
 const list = Array.isArray(perm) ? perm : [perm]
 return list.some((p) => hasPermission(p))
}

function viewAllows(item: SidebarMenuItem, mode: ViewMode): boolean {
 if (item.branchOnly && mode !== 'branch') return false
 if (item.globalOnly && mode !== 'global') return false
 return true
}

function featureAllows(hasFeature: HasFeature, feature?: PlanFeatureKey): boolean {
 if (!feature) return true
 return hasFeature(feature)
}

const filterItems = (
 items: SidebarMenuItem[],
 isSuperAdmin: boolean,
 hasPermission: HasPermission,
 hasFeature: HasFeature,
 mode: ViewMode,
): SidebarMenuItem[] => {
 return items
 .map((item) => {
 if (item.type === 'section') {
 return item
 }
 if (!viewAllows(item, mode)) {
 return null
 }

 if (!featureAllows(hasFeature, item.feature)) {
 return null
 }

 const subItems = item.subItems
 ? filterItems(item.subItems, isSuperAdmin, hasPermission, hasFeature, mode)
 : undefined

 const hasDirectAccess = permAllows(isSuperAdmin, hasPermission, item.perm)

 const hasChildren = Boolean(subItems && subItems.length > 0)

 if (!hasDirectAccess && !hasChildren) {
 return null
 }

 if (item.subItems && !hasChildren) {
 return null
 }

 return {
 ...item,
 subItems,
 }
 })
 .filter(Boolean) as SidebarMenuItem[]
}

const MARKETING_PERM: string[] = ['manage_promotions', 'manage_coupons']

const DELIVERY_FINANCE_PERM: string[] = [
 'delivery_view_settlements',
 'delivery_settle',
 'manage_deliveries',
]

/** Unfiltered sidebar definition — shared with viewModeRoutePolicy. */
export const SIDEBAR_MENU_TEMPLATE: SidebarMenuItem[] = [
 {
 id: 'nav-dashboard',
 label: 'الرئيسية',
 icon: 'las la-tachometer-alt',
 link: '/',
 },
 {
 id: 'nav-pos',
 label: 'نقطة البيع',
 icon: 'ri-shopping-cart-line',
 feature: 'pos',
 subItems: [
 {
 id: 'nav-pos-screen',
 label: 'شاشة البيع',
 icon: 'ri-shopping-cart-line',
 link: '/pos',
 perm: 'process_sales',
 branchOnly: true,
 },
 {
 id: 'nav-waiter',
 label: 'النادل',
 icon: 'ri-restaurant-line',
 link: '/waiter',
 perm: ['process_sales', 'manage_dining'],
 branchOnly: true,
 },
 {
 id: 'nav-sales',
 label: 'المبيعات',
 icon: 'ri-receipt-line',
 link: '/sales',
 perm: 'process_sales',
 },
 {
 id: 'nav-sales-products',
 label: 'مبيعات المنتجات',
 icon: 'las la-boxes',
 link: '/sales/products',
 perm: 'process_sales',
 },
 {
 id: 'nav-sales-layaway',
 label: 'خطط التقسيط',
 icon: 'ri-time-line',
 link: '/sales/layaway',
 perm: 'process_sales',
 },
 {
 id: 'nav-sales-returns',
 label: 'مرتجعات المبيعات',
 icon: 'ri-clipboard-fill',
 link: '/sales/returns',
 perm: 'void_receipt',
 },
 {
 id: 'nav-expenses',
 label: 'المصروفات',
 icon: 'ri-bank-line',
 link: '/expenses',
 perm: ['process_sales', 'manage_expenses'],
 },
 ],
 },
 {
 id: 'nav-restaurant',
 label: 'المطعم والصالات',
 icon: 'ri-restaurant-line',
 subItems: [
 {
 id: 'nav-dining-halls',
 label: 'القاعات والطاولات',
 icon: 'ri-building-line',
 link: '/dining-halls',
 perm: 'manage_dining',
 branchOnly: true,
 },
 ],
 },
 {
 id: 'nav-customers',
 label: 'العملاء',
 icon: 'ri-user-line',
 subItems: [
 {
 id: 'nav-customers-list',
 label: 'العملاء',
 icon: 'ri-user-line',
 link: '/customers',
 perm: ['manage_customers', 'process_sales'],
 },
 ],
 },
 {
 id: 'nav-inventory',
 label: 'المخزون',
 icon: 'las la-boxes',
 feature: 'inventory',
 subItems: [
 {
 id: 'nav-products',
 label: 'المنتجات',
 icon: 'las la-boxes',
 link: '/products',
 perm: 'manage_products',
 },
 {
 id: 'nav-raw-materials',
 label: 'الخامات / المواد الخام',
 icon: 'ri-flask-line',
 link: '/raw-materials',
 perm: 'manage_products',
 },
 {
 id: 'nav-categories',
 label: 'التصنيفات',
 icon: 'ri-folder-line',
 link: '/categories',
 perm: 'manage_categories',
 },
 {
 id: 'nav-inventory-main',
 label: 'نظرة عامة على المخزون',
 icon: 'ri-store-2-line',
 link: '/inventory',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-balances',
 label: 'أرصدة المخازن',
 icon: 'ri-file-list-line',
 link: '/inventory/balances',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-warehouses',
 label: 'المخازن',
 icon: 'ri-store-2-line',
 link: '/inventory/warehouses',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-movements',
 label: 'حركات المخزون',
 icon: 'ri-clipboard-fill',
 link: '/inventory/movements',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-reorder',
 label: 'قواعد إعادة الطلب',
 icon: 'ri-file-list-3-line',
 link: '/inventory/reorder-rules',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-requisitions',
 label: 'طلبات الشراء الداخلية',
 icon: 'ri-shopping-bag-line',
 link: '/inventory/requisitions',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-stock-counts',
 label: 'الجرد',
 icon: 'ri-clipboard-fill',
 link: '/inventory/stock-counts',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-transfer',
 label: 'تحويل مخزني',
 icon: 'ri-node-tree',
 link: '/inventory/transfers',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-adjustment',
 label: 'تسوية مخزنية',
 icon: 'ri-clipboard-fill',
 link: '/inventory/adjustments',
 perm: 'manage_inventory',
 },
 ],
 },
 {
 id: 'nav-purchases',
 label: 'المشتريات والموردين',
 icon: 'ri-truck-line',
 feature: 'purchases',
 subItems: [
 {
 id: 'nav-purchases-list',
 label: 'فواتير الشراء',
 icon: 'ri-file-list-line',
 link: '/purchases',
 perm: 'manage_purchases',
 },
 {
 id: 'nav-purchases-returns',
 label: 'مرتجعات الشراء',
 icon: 'ri-clipboard-fill',
 link: '/purchases/returns',
 perm: 'manage_purchases',
 },
 {
 id: 'nav-purchases-suppliers-nested',
 label: 'موردي المشتريات',
 icon: 'ri-user-line',
 link: '/purchases/suppliers',
 perm: 'manage_purchases',
 },
 {
 id: 'nav-suppliers',
 label: 'الموردون',
 icon: 'ri-user-line',
 link: '/suppliers',
 perm: 'manage_suppliers',
 },
 {
 id: 'nav-supplier-payments',
 label: 'دفعات الموردين',
 icon: 'ri-money-dollar-circle-line',
 link: '/supplier-payments',
 perm: 'manage_supplier_payments',
 },
 ],
 },
 {
 id: 'nav-delivery',
 label: 'التوصيل',
 icon: 'ri-truck-line',
 subItems: [
 {
 id: 'nav-delivery-orders',
 label: 'طلبات التوصيل',
 icon: 'ri-truck-line',
 link: '/delivery',
 perm: ['process_sales', 'manage_deliveries'],
 },
 {
 id: 'nav-drivers',
 label: 'السائقون',
 icon: 'ri-user-line',
 link: '/drivers',
 perm: 'manage_drivers',
 },
 {
 id: 'nav-delivery-zones',
 label: 'مناطق التوصيل',
 icon: 'ri-layout-grid-line',
 link: '/delivery-zones',
 perm: 'manage_deliveries',
 },
 {
 id: 'nav-driver-settlements',
 label: 'تسويات السائقين',
 icon: 'ri-receipt-line',
 link: '/driver-settlements',
 perm: DELIVERY_FINANCE_PERM,
 },
 {
 id: 'nav-delivery-finance',
 label: 'مالية التوصيل',
 icon: 'ri-file-list-3-line',
 link: '/delivery-finance',
 perm: DELIVERY_FINANCE_PERM,
 },
 {
 id: 'nav-delivery-finance-liabilities',
 label: 'التزامات التوصيل',
 icon: 'ri-bank-line',
 link: '/delivery-finance/liabilities',
 perm: DELIVERY_FINANCE_PERM,
 },
 {
 id: 'nav-delivery-finance-settlements',
 label: 'تسويات المالية',
 icon: 'ri-receipt-line',
 link: '/delivery-finance/settlements',
 perm: DELIVERY_FINANCE_PERM,
 },
 {
 id: 'nav-delivery-finance-alerts',
 label: 'تنبيهات المالية',
 icon: 'ri-file-list-line',
 link: '/delivery-finance/alerts',
 perm: DELIVERY_FINANCE_PERM,
 },
 ],
 },
 {
 id: 'nav-kitchen',
 label: 'المطبخ',
 icon: 'ri-restaurant-line',
 subItems: [
 {
 id: 'nav-kitchen-display',
 label: 'شاشة المطبخ',
 icon: 'ri-restaurant-line',
 link: '/kitchen',
 perm: ['view_kitchen', 'manage_kitchen'],
 branchOnly: true,
 },
 {
 id: 'nav-kitchen-print-jobs',
 label: 'طوابير الطباعة',
 icon: 'ri-printer-line',
 link: '/kitchen/print-jobs',
 perm: ['view_kitchen', 'manage_kitchen'],
 branchOnly: true,
 },
 {
 id: 'nav-kitchen-stations',
 label: 'محطات شاشة المطبخ',
 icon: 'ri-layout-grid-line',
 link: '/kitchen/stations',
 perm: 'manage_kitchen',
 branchOnly: true,
 },
 ],
 },
 {
 id: 'nav-shifts-vaults',
 label: 'الورديات والخزن',
 icon: 'ri-bank-line',
 subItems: [
 {
 id: 'nav-shifts',
 label: 'الورديات',
 icon: 'ri-time-line',
 link: '/shifts',
 perm: ['open_shift', 'close_shift', 'manage_shifts', 'access_admin_routes', 'process_sales'],
 },
 {
 id: 'nav-vaults',
 label: 'الخزن',
 icon: 'ri-safe-2-line',
 link: '/vaults',
 perm: ['access_admin_routes', 'open_shift', 'process_sales'],
 },
 {
 id: 'nav-vault-transactions',
 label: 'حركات الخزن',
 icon: 'ri-receipt-line',
 link: '/vaults/transactions',
 perm: 'manage_treasuries',
 },
 ],
 },
 {
 id: 'nav-marketing',
 label: 'التسويق',
 icon: 'ri-price-tag-3-line',
 perm: MARKETING_PERM,
 subItems: [
 {
 id: 'nav-marketing-promotions',
 label: 'العروض',
 icon: 'ri-price-tag-3-line',
 link: '/marketing/promotions',
 perm: 'manage_promotions',
 },
 {
 id: 'nav-marketing-coupons',
 label: 'الكوبونات',
 icon: 'ri-file-list-line',
 link: '/marketing/coupons',
 perm: 'manage_coupons',
 feature: 'coupons',
 },
 ],
 },
 {
 id: 'nav-reports',
 label: 'التقارير',
 icon: 'ri-file-list-3-line',
 perm: 'view_reports',
 feature: 'reports',
 subItems: [
 { id: 'nav-reports-hub', label: 'مركز التقارير', icon: 'ri-file-list-3-line', link: '/reports', perm: 'view_reports' },
 { id: 'nav-rep-sales-dash', label: 'لوحة المبيعات', icon: 'ri-file-list-3-line', link: '/reports/sales/dashboard', perm: 'view_reports' },
 { id: 'nav-rep-sales-refunds', label: 'تقرير المرتجعات', icon: 'ri-receipt-line', link: '/reports/sales/refunds', perm: 'view_reports' },
 { id: 'nav-rep-sales-ret-by-prod', label: 'مرتجعات بيع بالمنتج', icon: 'ri-receipt-line', link: '/reports/sales-returns-by-product', perm: 'view_reports' },
 { id: 'nav-rep-purch-ret-by-prod', label: 'مرتجعات شراء بالمنتج', icon: 'ri-arrow-go-back-line', link: '/reports/purchase-returns-by-product', perm: 'view_reports' },
 { id: 'nav-rep-sales-tax', label: 'تقرير الضرائب', icon: 'ri-bank-line', link: '/reports/sales/tax', perm: 'view_reports' },
 { id: 'nav-rep-sales-layaway', label: 'تقرير البيع الآجل', icon: 'ri-time-line', link: '/reports/sales/layaway', perm: 'view_reports' },
 { id: 'nav-rep-sales-hourly', label: 'مبيعات بالساعة', icon: 'ri-file-list-3-line', link: '/reports/sales/hourly', perm: 'view_reports' },
 { id: 'nav-rep-treasury', label: 'الخزائن', icon: 'ri-safe-2-line', link: '/reports/treasury', perm: 'view_reports', feature: 'advanced_reports' },
 { id: 'nav-rep-expenses', label: 'تقرير المصروفات', icon: 'ri-bank-line', link: '/reports/expenses', perm: 'view_reports', feature: 'advanced_reports' },
 { id: 'nav-rep-profit-loss', label: 'الأرباح والخسائر', icon: 'ri-line-chart-line', link: '/reports/profit-loss', perm: 'view_reports', feature: 'advanced_reports' },
 { id: 'nav-rep-budget-vs-actual', label: 'الموازنة مقابل الفعلي', icon: 'ri-funds-line', link: '/reports/budget-vs-actual', perm: 'view_reports', feature: 'advanced_reports' },
 { id: 'nav-rep-inv-val', label: 'تقييم المخزون', icon: 'las la-boxes', link: '/reports/inventory/valuation', perm: 'view_reports' },
 { id: 'nav-rep-inv-mov', label: 'حركات المخزون', icon: 'ri-clipboard-fill', link: '/reports/inventory/movements', perm: 'view_reports' },
 { id: 'nav-rep-inv-expiry', label: 'تقرير الصلاحية', icon: 'las la-boxes', link: '/reports/inventory/expiry', perm: 'view_reports' },
 { id: 'nav-rep-raw-materials', label: 'تقارير الخامات', icon: 'ri-flask-line', link: '/reports/inventory/raw-materials', perm: 'view_reports' },
 { id: 'nav-rep-recipes', label: 'تقارير تكلفة الوصفات', icon: 'ri-restaurant-line', link: '/reports/recipes', perm: 'view_reports' },
 { id: 'nav-rep-cust-aging', label: 'أعمار ديون العملاء', icon: 'ri-user-line', link: '/reports/customers/aging', perm: 'view_reports' },
 { id: 'nav-rep-sup-aging', label: 'أعمار الموردين', icon: 'ri-truck-line', link: '/reports/suppliers/aging', perm: 'view_reports' },
 { id: 'nav-rep-mkt-coupons', label: 'تقرير الكوبونات', icon: 'ri-file-list-line', link: '/reports/marketing/coupons', perm: 'view_reports' },
 { id: 'nav-rep-mkt-promo', label: 'تقرير العروض', icon: 'ri-price-tag-3-line', link: '/reports/marketing/promotions', perm: 'view_reports' },
 { id: 'nav-rep-gift', label: 'تقرير بطاقات الهدايا', icon: 'ri-gift-line', link: '/reports/gift-cards', perm: 'view_reports' },
 { id: 'nav-rep-dining', label: 'تقرير المطاعم', icon: 'ri-restaurant-line', link: '/reports/dining', perm: 'view_reports' },
 { id: 'nav-rep-delivery', label: 'تقرير التوصيل', icon: 'ri-truck-line', link: '/reports/delivery', perm: 'view_reports' },
 { id: 'nav-rep-shifts', label: 'أداء الورديات', icon: 'ri-time-line', link: '/reports/shifts', perm: 'view_reports', feature: 'advanced_reports' },
 { id: 'nav-rep-saved', label: 'التقارير المحفوظة', icon: 'ri-clipboard-fill', link: '/reports/saved', perm: 'view_reports' },
 { id: 'nav-reports-legacy', label: 'التقارير الكلاسيكية', icon: 'ri-file-list-line', link: '/reports/legacy', perm: 'view_reports' },
 ],
 },
 {
 id: 'nav-system',
 label: 'الإعدادات والإدارة',
 icon: 'ri-settings-line',
 subItems: [
 {
 id: 'nav-settings',
 label: 'الإعدادات',
 icon: 'ri-settings-line',
 link: '/settings',
 /** Matches who can use Settings tabs (users/roles/branches); cashiers use profile elsewhere. */
 perm: ['manage_users', 'manage_branches', 'manage_settings', 'access_admin_routes'],
 },
 {
 id: 'nav-branches',
 label: 'الفروع',
 icon: 'ri-building-line',
 link: '/branches',
 perm: 'manage_branches',
 globalOnly: true,
 feature: 'branches',
 },
 {
 id: 'nav-employees',
 label: 'الموظفون',
 icon: 'ri-shield-user-line',
 link: '/employees',
 perm: 'manage_users',
 },
 {
 id: 'nav-payments',
 label: 'المدفوعات',
 icon: 'ri-bank-line',
 link: '/payments',
 perm: 'manage_treasuries',
 },
 {
 id: 'nav-gift-cards',
 label: 'بطاقات الهدايا',
 icon: 'ri-gift-line',
 link: '/gift-cards',
 perm: 'manage_gift_cards',
 },
 {
 id: 'nav-activity-logs',
 label: 'سجل النشاط',
 icon: 'ri-file-list-3-line',
 link: '/activity-logs',
 perm: 'view_activity_logs',
 },
 {
 id: 'nav-settingsBackup',
 label: 'النسخ الاحتياطي',
 icon: 'ri-database-2-line',
 link: '/backup',
 perm: 'manage_settings',
 globalOnly: true,
 },
 ],
 },
 ];

export function buildSidebarMenu(
 isSuperAdmin: boolean,
 hasPermission: HasPermission,
 viewMode?: string,
 hasFeature: HasFeature = () => true,
): SidebarMenuItem[] {
 const mode = normalizeViewMode(viewMode)
 return filterItems(SIDEBAR_MENU_TEMPLATE, isSuperAdmin, hasPermission, hasFeature, mode)
}

export type MobileSidebarMenuItem = {
  id?: string;
  label: string;
  icon?: string;
  link?: string;
  type?: 'section';
  perm?: string | string[];
  branchOnly?: boolean;
  globalOnly?: boolean;
  feature?: PlanFeatureKey;
  nav?: SidebarNavAction;
  subItems?: MobileSidebarMenuItem[];
};

function toMobileItems(items: SidebarMenuItem[]): MobileSidebarMenuItem[] {
  const out: MobileSidebarMenuItem[] = [];

  for (const item of items) {
    if (item.type === 'section') {
      out.push({ type: 'section', label: item.label });
      continue;
    }

    const subItems = item.subItems ? toMobileItems(item.subItems) : undefined;
    const nav = item.link ? webLinkToNav(item.link, item.label) : undefined;

    if (!nav && (!subItems || subItems.length === 0)) {
      continue;
    }

    out.push({
      id: item.id,
      label: item.label,
      icon: item.icon,
      link: item.link,
      perm: item.perm,
      branchOnly: item.branchOnly,
      globalOnly: item.globalOnly,
      feature: item.feature,
      nav,
      subItems,
    });
  }

  return out;
}

function dropEmptySections(items: MobileSidebarMenuItem[]): MobileSidebarMenuItem[] {
  const result: MobileSidebarMenuItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type !== 'section') {
      result.push(item);
      continue;
    }
    const nextItems: MobileSidebarMenuItem[] = [];
    let j = i + 1;
    while (j < items.length && items[j].type !== 'section') {
      nextItems.push(items[j]);
      j++;
    }
    if (nextItems.length > 0) {
      result.push(item, ...nextItems);
    }
    i = j - 1;
  }
  return result;
}

/** Same filtering as web, then map links to mobile routes (unmapped web-only pages are omitted). */
export function buildMobileSidebarMenu(
  isSuperAdmin: boolean,
  hasPermission: HasPermission,
  viewMode?: string,
  hasFeature: HasFeature = () => true,
): MobileSidebarMenuItem[] {
  const webMenu = buildSidebarMenu(isSuperAdmin, hasPermission, viewMode, hasFeature);
  return dropEmptySections(toMobileItems(webMenu));
}
