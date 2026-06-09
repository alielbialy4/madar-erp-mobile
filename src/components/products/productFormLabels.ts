import type { InventoryMode } from '@/types/api';

export const TRACK_INVENTORY_HELPER_AR =
  'المنتج المخزني يُخصم من المخزون عند البيع. المنتج بوصفة يُحسب من مكوناته. غير المخزني للخدمات والأصناف بدون كمية.';

export const TRACK_INVENTORY_OFF_NOTE_AR = 'الرصيد الافتتاحي غير متاح لهذا النوع من المنتجات.';

export const TRACK_EXPIRY_HELPER_AR = 'تفعيل تتبع الصلاحية يسمح بتسجيل تواريخ الانتهاء في حركات المخزون.';

export const TRACK_INVENTORY_VS_EXPIRY_AR =
  'تتبع المخزون يخصم الكميات. تتبع الصلاحية يضيف تواريخ انتهاء للدفعات — يمكن تفعيلهما معاً للمنتج المخزني.';

export const EXPIRY_REQUIRES_INVENTORY_AR = 'تتبع الصلاحية متاح فقط للمنتجات المخزنية.';

export const OPENING_STOCK_HELPER_AR = 'يُطبّق مرة واحدة عند إنشاء المنتج فقط.';

export const OPTION_GROUPS_HELPER_AR =
  'مجموعات الخيارات تظهر في نقطة البيع — مثل الحجم، الإضافات، أو التخصيصات. يمكن جعلها إلزامية أو اختيارية.';

export const INVENTORY_MODE_HINTS: Record<string, { title: string; body: string }> = {
  stock_product: {
    title: 'منتج مخزني',
    body: 'يُخصم من المخزون عند البيع ويُعاد عند المرتجع.',
  },
  recipe_product: {
    title: 'منتج بوصفة',
    body: 'يُحسب من مكونات عند البيع — لا يُخصم المنتج نفسه مباشرة.',
  },
  non_stock: {
    title: 'غير مخزني',
    body: 'خدمة أو صنف بدون كمية — مناسب للخدمات والرسوم.',
  },
};

export const SELLABLE_ROLE_OPTIONS = [
  { label: 'منتج قابل للبيع', value: 'sellable_product' },
  { label: 'خدمة', value: 'service' },
] as const;

export const RAW_MATERIAL_ROLE_OPTIONS = [
  { label: 'خامة', value: 'raw_material' },
  { label: 'مواد تغليف', value: 'packaging_material' },
  { label: 'نصف مصنع', value: 'semi_finished' },
] as const;

export function inventoryModeContextHint(mode: InventoryMode): string {
  return INVENTORY_MODE_HINTS[mode]?.body ?? TRACK_INVENTORY_HELPER_AR;
}

export const STORAGE_TYPE_OPTIONS = [
  { label: 'جاف', value: 'dry' },
  { label: 'مبرد', value: 'chilled' },
  { label: 'مجمد', value: 'frozen' },
  { label: 'عادي', value: 'ambient' },
] as const;
