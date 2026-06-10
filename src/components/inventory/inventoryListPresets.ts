import type { InventoryListPresetKey } from '@/types/navigation';

export type InventoryListSurface =
  | InventoryListPresetKey
  | 'warehouses'
  | 'transfers'
  | 'adjustments'
  | 'products';

export type InventoryFilterKey =
  | 'status'
  | 'warehouse_id'
  | 'product_id'
  | 'movement_type'
  | 'direction'
  | 'date_from'
  | 'date_to'
  | 'near_expiry_only'
  | 'expired_only'
  | 'low_stock_only'
  | 'branch_id'
  | 'stock_status';

export type InventoryListPreset = {
  key: InventoryListPresetKey;
  surface: InventoryListSurface;
  title: string;
  eyebrow: string;
  subtitle: string;
  endpoint: string;
  searchParam?: 'search' | 'q';
  supportsSearch?: boolean;
  supportedFilters?: InventoryFilterKey[];
  defaultParams?: Record<string, unknown>;
  emptyTitle: string;
  emptyMessage?: string;
};

export const INVENTORY_LIST_PRESETS: Record<InventoryListPresetKey, InventoryListPreset> = {
  balances: {
    key: 'balances',
    surface: 'balances',
    title: 'أرصدة المخزون',
    eyebrow: 'المخزون',
    subtitle: 'كميات المنتجات حسب المخزن والفرع — ابحث بالاسم أو الباركود.',
    endpoint: '/inventory/balances',
    searchParam: 'q',
    supportsSearch: true,
    supportedFilters: ['warehouse_id', 'product_id', 'low_stock_only'],
    emptyTitle: 'لا توجد أرصدة',
    emptyMessage: 'لا توجد أرصدة مطابقة للبحث أو الفلاتر الحالية.',
  },
  warehouses: {
    key: 'warehouses',
    surface: 'warehouses',
    title: 'المخازن',
    eyebrow: 'المخزون',
    subtitle: 'قائمة المخازن النشطة وربطها بالفروع.',
    endpoint: '/warehouses',
    searchParam: 'search',
    supportsSearch: true,
    supportedFilters: ['status'],
    emptyTitle: 'لا توجد مخازن',
    emptyMessage: 'لم يتم تعريف مخازن بعد في النظام.',
  },
  movements: {
    key: 'movements',
    title: 'حركات المخزون',
    surface: 'movements',
    eyebrow: 'المخزون',
    subtitle: 'سجل الإدخال والإخراج والتحويلات والتسويات.',
    endpoint: '/inventory/movements',
    searchParam: 'q',
    supportsSearch: true,
    supportedFilters: ['warehouse_id', 'movement_type', 'direction', 'date_from', 'date_to'],
    emptyTitle: 'لا توجد حركات',
    emptyMessage: 'لا توجد حركات في الفترة المعروضة.',
  },
  expiry: {
    key: 'expiry',
    surface: 'expiry',
    title: 'تنبيهات الصلاحية',
    eyebrow: 'المخزون',
    subtitle: 'دفعات قريبة من الانتهاء أو منتهية.',
    endpoint: '/inventory/expiry-stock',
    supportsSearch: false,
    supportedFilters: ['warehouse_id', 'near_expiry_only', 'expired_only'],
    defaultParams: { near_expiry_only: true },
    emptyTitle: 'لا توجد تنبيهات',
    emptyMessage: 'لا توجد دفعات قريبة من انتهاء الصلاحية.',
  },
  reorderRules: {
    key: 'reorderRules',
    surface: 'reorderRules',
    title: 'قواعد إعادة الطلب',
    eyebrow: 'سياسات',
    subtitle: 'حدود إعادة التوريد لكل منتج ومخزن.',
    endpoint: '/inventory/reorder-rules',
    supportsSearch: false,
    supportedFilters: ['branch_id'],
    emptyTitle: 'لا توجد قواعد',
  },
  requisitions: {
    key: 'requisitions',
    surface: 'requisitions',
    title: 'طلبات الشراء الداخلية',
    eyebrow: 'المخزون',
    subtitle: 'طلبات التوريد بين الفروع والمخازن.',
    endpoint: '/inventory/requisitions',
    supportsSearch: false,
    supportedFilters: ['status'],
    emptyTitle: 'لا توجد طلبات',
  },
  stockCounts: {
    key: 'stockCounts',
    surface: 'stockCounts',
    title: 'جرد المخزون',
    eyebrow: 'المخزون',
    subtitle: 'جلسات الجرد ونتائجها.',
    endpoint: '/inventory/stock-counts',
    searchParam: 'search',
    supportsSearch: true,
    supportedFilters: ['status', 'warehouse_id', 'date_from', 'date_to'],
    emptyTitle: 'لا توجد جلسات جرد',
  },
};

export const DOC_LIST_SURFACES: Record<'transfers' | 'adjustments', { surface: InventoryListSurface; searchParam: 'search' | 'q'; supportedFilters: InventoryFilterKey[] }> = {
  transfers: {
    surface: 'transfers',
    searchParam: 'search',
    supportedFilters: ['status', 'warehouse_id', 'date_from', 'date_to'],
  },
  adjustments: {
    surface: 'adjustments',
    searchParam: 'search',
    supportedFilters: ['status', 'warehouse_id', 'date_from', 'date_to'],
  },
};

export function getPresetSearchParam(key: InventoryListPresetKey): 'search' | 'q' | undefined {
  const preset = INVENTORY_LIST_PRESETS[key];
  if (preset.supportsSearch === false) return undefined;
  return preset.searchParam ?? 'search';
}
