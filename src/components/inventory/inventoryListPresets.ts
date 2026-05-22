import type { InventoryListPresetKey } from '@/types/navigation';

export type InventoryListPreset = {
  key: InventoryListPresetKey;
  title: string;
  eyebrow: string;
  subtitle: string;
  endpoint: string;
  searchParam?: 'search' | 'q';
  defaultParams?: Record<string, unknown>;
  emptyTitle: string;
  emptyMessage?: string;
};

export const INVENTORY_LIST_PRESETS: Record<InventoryListPresetKey, InventoryListPreset> = {
  balances: {
    key: 'balances',
    title: 'أرصدة المخزون',
    eyebrow: 'المخزون',
    subtitle: 'كميات المنتجات حسب المخزن والفرع — ابحث بالاسم أو الباركود.',
    endpoint: '/inventory/balances',
    emptyTitle: 'لا توجد أرصدة',
    emptyMessage: 'لا توجد أرصدة مطابقة للبحث أو الفلاتر الحالية.',
  },
  warehouses: {
    key: 'warehouses',
    title: 'المخازن',
    eyebrow: 'المخزون',
    subtitle: 'قائمة المخازن النشطة وربطها بالفروع.',
    endpoint: '/warehouses',
    emptyTitle: 'لا توجد مخازن',
    emptyMessage: 'لم يتم تعريف مخازن بعد في النظام.',
  },
  movements: {
    key: 'movements',
    title: 'حركات المخزون',
    eyebrow: 'المخزون',
    subtitle: 'سجل الإدخال والإخراج والتحويلات والتسويات.',
    endpoint: '/inventory/movements',
    emptyTitle: 'لا توجد حركات',
    emptyMessage: 'لا توجد حركات في الفترة المعروضة.',
  },
  expiry: {
    key: 'expiry',
    title: 'تنبيهات الصلاحية',
    eyebrow: 'المخزون',
    subtitle: 'دفعات قريبة من الانتهاء أو منتهية.',
    endpoint: '/inventory/expiry-stock',
    defaultParams: { near_expiry_only: true },
    emptyTitle: 'لا توجد تنبيهات',
    emptyMessage: 'لا توجد دفعات قريبة من انتهاء الصلاحية.',
  },
  reorderRules: {
    key: 'reorderRules',
    title: 'قواعد إعادة الطلب',
    eyebrow: 'سياسات',
    subtitle: 'حدود إعادة التوريد لكل منتج ومخزن.',
    endpoint: '/inventory/reorder-rules',
    emptyTitle: 'لا توجد قواعد',
  },
  requisitions: {
    key: 'requisitions',
    title: 'طلبات الشراء الداخلية',
    eyebrow: 'المخزون',
    subtitle: 'طلبات التوريد بين الفروع والمخازن.',
    endpoint: '/inventory/requisitions',
    emptyTitle: 'لا توجد طلبات',
  },
  stockCounts: {
    key: 'stockCounts',
    title: 'جرد المخزون',
    eyebrow: 'المخزون',
    subtitle: 'جلسات الجرد ونتائجها.',
    endpoint: '/inventory/stock-counts',
    emptyTitle: 'لا توجد جلسات جرد',
  },
};
