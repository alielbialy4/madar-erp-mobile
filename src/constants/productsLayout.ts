import type { ProductListFilters } from '@/components/lists/ListFiltersBar';

export const PRODUCTS_FILTER_SIDEBAR_WIDTH = 272;

export function getProductGridColumns(width: number, height: number): number {
  const isTablet = width >= 900;
  const isLandscape = width > height;
  if (!isTablet) return isLandscape && width >= 600 ? 2 : 1;
  return isLandscape ? 3 : 2;
}

export function countActiveProductFilters(filters: ProductListFilters, rawMaterialMode = false): number {
  let count = 0;
  if (rawMaterialMode) {
    if (filters.product_role) count += 1;
    if (filters.raw_status) count += 1;
    return count;
  }
  if (filters.category_id) count += 1;
  if (filters.stock_status) count += 1;
  if (filters.featured) count += 1;
  return count;
}

export const EMPTY_PRODUCT_FILTERS: ProductListFilters = {
  category_id: null,
  stock_status: null,
  featured: null,
  product_role: null,
  raw_status: null,
};

export type ActiveFilterChip = {
  key: string;
  label: string;
  clear: (prev: ProductListFilters) => ProductListFilters;
};

const STOCK_LABELS: Record<string, string> = { low: 'مخزون منخفض', out: 'نفد المخزون' };
const FEATURED_LABELS: Record<string, string> = { '1': 'مميز', '0': 'عادي' };
const RAW_ROLE_LABELS: Record<string, string> = {
  raw_material: 'خامات',
  packaging_material: 'تعبئة',
  semi_finished: 'نصف مُصنّع',
};
const RAW_STATUS_LABELS: Record<string, string> = {
  low: 'منخفض',
  expiry: 'صلاحية/دفعات',
  inactive: 'غير نشط',
};

export function getActiveProductFilterChips(
  filters: ProductListFilters,
  categories: { id: number; name: string }[],
  rawMaterialMode = false,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (rawMaterialMode) {
    if (filters.product_role) {
      chips.push({
        key: 'role',
        label: RAW_ROLE_LABELS[filters.product_role] ?? filters.product_role,
        clear: (prev) => ({ ...prev, product_role: null }),
      });
    }
    if (filters.raw_status) {
      chips.push({
        key: 'raw_status',
        label: RAW_STATUS_LABELS[filters.raw_status] ?? filters.raw_status,
        clear: (prev) => ({ ...prev, raw_status: null }),
      });
    }
    return chips;
  }

  if (filters.category_id) {
    const name = categories.find((c) => String(c.id) === filters.category_id)?.name ?? 'تصنيف';
    chips.push({
      key: 'category',
      label: name,
      clear: (prev) => ({ ...prev, category_id: null }),
    });
  }
  if (filters.stock_status) {
    chips.push({
      key: 'stock',
      label: STOCK_LABELS[filters.stock_status] ?? filters.stock_status,
      clear: (prev) => ({ ...prev, stock_status: null }),
    });
  }
  if (filters.featured) {
    chips.push({
      key: 'featured',
      label: FEATURED_LABELS[filters.featured] ?? filters.featured,
      clear: (prev) => ({ ...prev, featured: null }),
    });
  }

  return chips;
}
