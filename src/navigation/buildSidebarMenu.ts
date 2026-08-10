/**
 * Sidebar menu builder — mirrored from `front/src/Layouts/buildSidebarMenu.ts`.
 * Web paths are mapped to mobile navigation via `sidebarNavMap.ts`.
 * Template `label` values are i18n keys (same as web `nav.*`), translated at build time.
 */

import i18n from '@/i18n';
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
 label: 'nav.dashboard',
 icon: 'las la-tachometer-alt',
 link: '/',
 },
 {
 id: 'nav-pos',
 label: 'nav.pos',
 icon: 'ri-shopping-cart-line',
 feature: 'pos',
 subItems: [
 {
 id: 'nav-pos-screen',
 label: 'nav.pos.screen',
 icon: 'ri-shopping-cart-line',
 link: '/pos',
 perm: 'process_sales',
 branchOnly: true,
 },
 {
 id: 'nav-waiter',
 label: 'nav.waiter',
 icon: 'ri-restaurant-line',
 link: '/waiter',
 perm: ['process_sales', 'manage_dining'],
 branchOnly: true,
 },
 {
 id: 'nav-sales',
 label: 'nav.sales',
 icon: 'ri-receipt-line',
 link: '/sales',
 perm: 'process_sales',
 },
 {
 id: 'nav-sales-products',
 label: 'nav.sales.products',
 icon: 'las la-boxes',
 link: '/sales/products',
 perm: 'process_sales',
 },
 {
 id: 'nav-sales-layaway',
 label: 'nav.sales.layaway',
 icon: 'ri-time-line',
 link: '/sales/layaway',
 perm: 'process_sales',
 },
 {
 id: 'nav-sales-returns',
 label: 'nav.sales.returns',
 icon: 'ri-clipboard-fill',
 link: '/sales/returns',
 perm: 'void_receipt',
 },
 {
 id: 'nav-expenses',
 label: 'nav.expenses',
 icon: 'ri-bank-line',
 link: '/expenses',
 perm: ['process_sales', 'manage_expenses'],
 },
 ],
 },
 {
 id: 'nav-restaurant',
 label: 'nav.restaurant',
 icon: 'ri-restaurant-line',
 subItems: [
 {
 id: 'nav-dining-halls',
 label: 'nav.diningHalls',
 icon: 'ri-building-line',
 link: '/dining-halls',
 perm: 'manage_dining',
 branchOnly: true,
 },
 ],
 },
 {
 id: 'nav-customers',
 label: 'nav.customers',
 icon: 'ri-user-line',
 subItems: [
 {
 id: 'nav-customers-list',
 label: 'nav.customers',
 icon: 'ri-user-line',
 link: '/customers',
 perm: ['manage_customers', 'process_sales'],
 },
 ],
 },
 {
 id: 'nav-inventory',
 label: 'nav.inventory',
 icon: 'las la-boxes',
 feature: 'inventory',
 subItems: [
 {
 id: 'nav-products',
 label: 'nav.products',
 icon: 'las la-boxes',
 link: '/products',
 perm: 'manage_products',
 },
 {
 id: 'nav-raw-materials',
 label: 'nav.rawMaterials',
 icon: 'ri-flask-line',
 link: '/raw-materials',
 perm: 'manage_products',
 },
 {
 id: 'nav-categories',
 label: 'nav.categories',
 icon: 'ri-folder-line',
 link: '/categories',
 perm: 'manage_categories',
 },
 {
 id: 'nav-inventory-main',
 label: 'nav.inventory.overview',
 icon: 'ri-store-2-line',
 link: '/inventory',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-balances',
 label: 'nav.inventory.balances',
 icon: 'ri-file-list-line',
 link: '/inventory/balances',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-warehouses',
 label: 'nav.inventory.warehouses',
 icon: 'ri-store-2-line',
 link: '/inventory/warehouses',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-movements',
 label: 'nav.inventory.movements',
 icon: 'ri-clipboard-fill',
 link: '/inventory/movements',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-reorder',
 label: 'mobile.nav.reorderRules',
 icon: 'ri-file-list-3-line',
 link: '/inventory/reorder-rules',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-requisitions',
 label: 'nav.inventory.requisitions',
 icon: 'ri-shopping-bag-line',
 link: '/inventory/requisitions',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-stock-counts',
 label: 'nav.inventory.stockCounts',
 icon: 'ri-clipboard-fill',
 link: '/inventory/stock-counts',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-transfer',
 label: 'inventory.movement.type.transfer',
 icon: 'ri-node-tree',
 link: '/inventory/transfers',
 perm: 'manage_inventory',
 },
 {
 id: 'nav-inventory-adjustment',
 label: 'inventory.movement.type.adjustment',
 icon: 'ri-clipboard-fill',
 link: '/inventory/adjustments',
 perm: 'manage_inventory',
 },
 ],
 },
 {
 id: 'nav-purchases',
 label: 'mobile.nav.purchasesSuppliers',
 icon: 'ri-truck-line',
 feature: 'purchases',
 subItems: [
 {
 id: 'nav-purchases-list',
 label: 'nav.purchases.invoices',
 icon: 'ri-file-list-line',
 link: '/purchases',
 perm: 'manage_purchases',
 },
 {
 id: 'nav-purchases-returns',
 label: 'nav.purchases.returns',
 icon: 'ri-clipboard-fill',
 link: '/purchases/returns',
 perm: 'manage_purchases',
 },
 {
 id: 'nav-purchases-suppliers-nested',
 label: 'nav.purchases.suppliers',
 icon: 'ri-user-line',
 link: '/purchases/suppliers',
 perm: 'manage_purchases',
 },
 {
 id: 'nav-suppliers',
 label: 'nav.suppliers',
 icon: 'ri-user-line',
 link: '/suppliers',
 perm: 'manage_suppliers',
 },
 {
 id: 'nav-supplier-payments',
 label: 'nav.supplierPayments',
 icon: 'ri-money-dollar-circle-line',
 link: '/supplier-payments',
 perm: 'manage_supplier_payments',
 },
 ],
 },
 {
 id: 'nav-delivery',
 label: 'nav.delivery',
 icon: 'ri-truck-line',
 subItems: [
 {
 id: 'nav-delivery-orders',
 label: 'nav.delivery.orders',
 icon: 'ri-truck-line',
 link: '/delivery',
 perm: ['process_sales', 'manage_deliveries'],
 },
 {
 id: 'nav-drivers',
 label: 'nav.drivers',
 icon: 'ri-user-line',
 link: '/drivers',
 perm: 'manage_drivers',
 },
 {
 id: 'nav-delivery-zones',
 label: 'nav.delivery.zones',
 icon: 'ri-layout-grid-line',
 link: '/delivery-zones',
 perm: 'manage_deliveries',
 },
 {
 id: 'nav-driver-settlements',
 label: 'nav.driverSettlements',
 icon: 'ri-receipt-line',
 link: '/driver-settlements',
 perm: DELIVERY_FINANCE_PERM,
 },
 {
 id: 'nav-delivery-finance',
 label: 'nav.deliveryFinance',
 icon: 'ri-file-list-3-line',
 link: '/delivery-finance',
 perm: DELIVERY_FINANCE_PERM,
 },
 {
 id: 'nav-delivery-finance-liabilities',
 label: 'nav.deliveryFinance.liabilities',
 icon: 'ri-bank-line',
 link: '/delivery-finance/liabilities',
 perm: DELIVERY_FINANCE_PERM,
 },
 {
 id: 'nav-delivery-finance-settlements',
 label: 'nav.deliveryFinance.settlements',
 icon: 'ri-receipt-line',
 link: '/delivery-finance/settlements',
 perm: DELIVERY_FINANCE_PERM,
 },
 {
 id: 'nav-delivery-finance-alerts',
 label: 'nav.deliveryFinance.alerts',
 icon: 'ri-file-list-line',
 link: '/delivery-finance/alerts',
 perm: DELIVERY_FINANCE_PERM,
 },
 ],
 },
 {
 id: 'nav-kitchen',
 label: 'nav.kitchen',
 icon: 'ri-restaurant-line',
 subItems: [
 {
 id: 'nav-kitchen-display',
 label: 'nav.kitchen.display',
 icon: 'ri-restaurant-line',
 link: '/kitchen',
 perm: ['view_kitchen', 'manage_kitchen'],
 branchOnly: true,
 },
 {
 id: 'nav-kitchen-print-jobs',
 label: 'nav.kitchen.printJobs',
 icon: 'ri-printer-line',
 link: '/kitchen/print-jobs',
 perm: ['view_kitchen', 'manage_kitchen'],
 branchOnly: true,
 },
 {
 id: 'nav-kitchen-stations',
 label: 'nav.kitchen.stations',
 icon: 'ri-layout-grid-line',
 link: '/kitchen/stations',
 perm: 'manage_kitchen',
 branchOnly: true,
 },
 ],
 },
 {
 id: 'nav-shifts-vaults',
 label: 'nav.shiftsVaults',
 icon: 'ri-bank-line',
 subItems: [
 {
 id: 'nav-shifts',
 label: 'nav.shifts',
 icon: 'ri-time-line',
 link: '/shifts',
 perm: ['open_shift', 'close_shift', 'manage_shifts', 'access_admin_routes', 'process_sales'],
 },
 {
 id: 'nav-vaults',
 label: 'mobile.nav.vaults',
 icon: 'ri-safe-2-line',
 link: '/vaults',
 perm: ['access_admin_routes', 'open_shift', 'process_sales'],
 },
 {
 id: 'nav-vault-transactions',
 label: 'nav.vaultTransactions',
 icon: 'ri-receipt-line',
 link: '/vaults/transactions',
 perm: 'manage_treasuries',
 },
 {
 id: 'nav-financial-accounts',
 label: 'nav.reports.financialAccounts',
 icon: 'ri-bank-card-line',
 link: '/financial-accounts',
 perm: ['view_account_transactions', 'view_account_balances', 'manage_financial_accounts', 'manage_treasuries', 'access_admin_routes'],
 },
 ],
 },
 {
 id: 'nav-marketing',
 label: 'Marketing',
 icon: 'ri-price-tag-3-line',
 perm: MARKETING_PERM,
 subItems: [
 {
 id: 'nav-marketing-promotions',
 label: 'nav.marketing.promotions',
 icon: 'ri-price-tag-3-line',
 link: '/marketing/promotions',
 perm: 'manage_promotions',
 },
 {
 id: 'nav-marketing-coupons',
 label: 'nav.marketing.coupons',
 icon: 'ri-file-list-line',
 link: '/marketing/coupons',
 perm: 'manage_coupons',
 feature: 'coupons',
 },
 ],
 },
 {
 id: 'nav-reports',
 label: 'nav.reports',
 icon: 'ri-file-list-3-line',
 perm: 'view_reports',
 feature: 'reports',
 subItems: [
 { id: 'nav-reports-hub', label: 'nav.reports.hub', icon: 'ri-file-list-3-line', link: '/reports', perm: 'view_reports' },
 { id: 'nav-rep-sales-dash', label: 'nav.reports.salesDashboard', icon: 'ri-file-list-3-line', link: '/reports/sales/dashboard', perm: 'view_reports' },
 { id: 'nav-rep-sales-refunds', label: 'nav.reports.salesRefunds', icon: 'ri-receipt-line', link: '/reports/sales/refunds', perm: 'view_reports' },
 { id: 'nav-rep-sales-ret-by-prod', label: 'nav.reports.salesReturnsByProduct', icon: 'ri-receipt-line', link: '/reports/sales-returns-by-product', perm: 'view_reports' },
 { id: 'nav-rep-purch-ret-by-prod', label: 'nav.reports.purchaseReturnsByProduct', icon: 'ri-arrow-go-back-line', link: '/reports/purchase-returns-by-product', perm: 'view_reports' },
 { id: 'nav-rep-sales-tax', label: 'nav.reports.salesTax', icon: 'ri-bank-line', link: '/reports/sales/tax', perm: 'view_reports' },
 { id: 'nav-rep-sales-layaway', label: 'mobile.nav.creditSalesReport', icon: 'ri-time-line', link: '/reports/sales/layaway', perm: 'view_reports' },
 { id: 'nav-rep-sales-hourly', label: 'nav.reports.salesHourly', icon: 'ri-file-list-3-line', link: '/reports/sales/hourly', perm: 'view_reports' },
 { id: 'nav-rep-treasury', label: 'nav.reports.treasury', icon: 'ri-safe-2-line', link: '/reports/treasury', perm: 'view_reports', feature: 'advanced_reports' },
 { id: 'nav-rep-expenses', label: 'nav.reports.expenses', icon: 'ri-bank-line', link: '/reports/expenses', perm: 'view_reports', feature: 'advanced_reports' },
 { id: 'nav-rep-profit-loss', label: 'nav.reports.profitLoss', icon: 'ri-line-chart-line', link: '/reports/profit-loss', perm: 'view_reports', feature: 'advanced_reports' },
 { id: 'nav-rep-budget-vs-actual', label: 'nav.reports.budgetVsActual', icon: 'ri-funds-line', link: '/reports/budget-vs-actual', perm: 'view_reports', feature: 'advanced_reports' },
 { id: 'nav-rep-inv-val', label: 'nav.reports.inventoryValuation', icon: 'las la-boxes', link: '/reports/inventory/valuation', perm: 'view_reports' },
 { id: 'nav-rep-inv-mov', label: 'nav.inventory.movements', icon: 'ri-clipboard-fill', link: '/reports/inventory/movements', perm: 'view_reports' },
 { id: 'nav-rep-inv-expiry', label: 'nav.reports.inventoryExpiry', icon: 'las la-boxes', link: '/reports/inventory/expiry', perm: 'view_reports' },
 { id: 'nav-rep-raw-materials', label: 'nav.reports.rawMaterials', icon: 'ri-flask-line', link: '/reports/inventory/raw-materials', perm: 'view_reports' },
 { id: 'nav-rep-recipes', label: 'nav.reports.recipes', icon: 'ri-restaurant-line', link: '/reports/recipes', perm: 'view_reports' },
 { id: 'nav-rep-cust-aging', label: 'nav.reports.customerAging', icon: 'ri-user-line', link: '/reports/customers/aging', perm: 'view_reports' },
 { id: 'nav-rep-sup-aging', label: 'nav.reports.supplierAging', icon: 'ri-truck-line', link: '/reports/suppliers/aging', perm: 'view_reports' },
 { id: 'nav-rep-mkt-coupons', label: 'nav.reports.marketingCoupons', icon: 'ri-file-list-line', link: '/reports/marketing/coupons', perm: 'view_reports' },
 { id: 'nav-rep-mkt-promo', label: 'nav.reports.marketingPromotions', icon: 'ri-price-tag-3-line', link: '/reports/marketing/promotions', perm: 'view_reports' },
 { id: 'nav-rep-gift', label: 'nav.reports.giftCards', icon: 'ri-gift-line', link: '/reports/gift-cards', perm: 'view_reports' },
 { id: 'nav-rep-dining', label: 'nav.reports.dining', icon: 'ri-restaurant-line', link: '/reports/dining', perm: 'view_reports' },
 { id: 'nav-rep-delivery', label: 'nav.reports.delivery', icon: 'ri-truck-line', link: '/reports/delivery', perm: 'view_reports' },
 { id: 'nav-rep-shifts', label: 'nav.reports.shifts', icon: 'ri-time-line', link: '/reports/shifts', perm: 'view_reports', feature: 'advanced_reports' },
 { id: 'nav-rep-device-sync-manifest', label: 'mobile.nav.posDeviceSync', icon: 'ri-device-line', link: '/reports/operations/device-sync-manifest', perm: 'view_reports' },
 { id: 'nav-rep-drawer-reconciliation', label: 'mobile.nav.drawerSettlement', icon: 'ri-scales-3-line', link: '/reports/operations/drawer-reconciliation', perm: 'view_reports' },
 { id: 'nav-rep-saved', label: 'nav.reports.saved', icon: 'ri-clipboard-fill', link: '/reports/saved', perm: 'view_reports' },
 { id: 'nav-reports-legacy', label: 'nav.reports.legacy', icon: 'ri-file-list-line', link: '/reports/legacy', perm: 'view_reports' },
 ],
 },
 {
 id: 'nav-system',
 label: 'nav.system',
 icon: 'ri-settings-line',
 subItems: [
 {
 id: 'nav-settings',
 label: 'nav.settings',
 icon: 'ri-settings-line',
 link: '/settings',
 /** Matches who can use Settings tabs (users/roles/branches); cashiers use profile elsewhere. */
 perm: ['manage_users', 'manage_branches', 'manage_settings', 'access_admin_routes'],
 },
 {
 id: 'nav-branches',
 label: 'nav.branches',
 icon: 'ri-building-line',
 link: '/branches',
 perm: 'manage_branches',
 globalOnly: true,
 feature: 'branches',
 },
 {
 id: 'nav-employees',
 label: 'employees.tabs.staff',
 icon: 'ri-shield-user-line',
 link: '/employees',
 perm: 'manage_users',
 },
 {
 id: 'nav-payments',
 label: 'nav.payments',
 icon: 'ri-bank-line',
 link: '/payments',
 perm: 'manage_treasuries',
 },
 {
 id: 'nav-gift-cards',
 label: 'nav.giftCards',
 icon: 'ri-gift-line',
 link: '/gift-cards',
 perm: 'manage_gift_cards',
 },
 {
 id: 'nav-activity-logs',
 label: 'nav.activityLogs',
 icon: 'ri-file-list-3-line',
 link: '/activity-logs',
 perm: 'view_activity_logs',
 },
 {
 id: 'nav-settingsBackup',
 label: 'nav.settingsBackup',
 icon: 'ri-database-2-line',
 link: '/backup',
 perm: 'manage_settings',
 globalOnly: true,
 },
 ],
 },
 ];

function translateMenuLabels(items: SidebarMenuItem[]): SidebarMenuItem[] {
  return items.map((item) => ({
    ...item,
    label: i18n.t(item.label),
    subItems: item.subItems ? translateMenuLabels(item.subItems) : undefined,
  }));
}

export function buildSidebarMenu(
 isSuperAdmin: boolean,
 hasPermission: HasPermission,
 viewMode?: string,
 hasFeature: HasFeature = () => true,
): SidebarMenuItem[] {
 const mode = normalizeViewMode(viewMode)
 const filtered = filterItems(SIDEBAR_MENU_TEMPLATE, isSuperAdmin, hasPermission, hasFeature, mode)
 return translateMenuLabels(filtered)
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
