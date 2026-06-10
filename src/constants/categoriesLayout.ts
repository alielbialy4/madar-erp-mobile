export const CATEGORIES_FILTER_SIDEBAR_WIDTH = 272;

export type CategoryStatusFilter = 'all' | 'active' | 'inactive';

export type CategoryListFilters = {
  status: CategoryStatusFilter;
};

export const EMPTY_CATEGORY_FILTERS: CategoryListFilters = {
  status: 'all',
};

export function getCategoryGridColumns(width: number, height: number): number {
  const isTablet = width >= 900;
  const isLandscape = width > height;
  if (!isTablet) return isLandscape && width >= 600 ? 2 : 1;
  return isLandscape ? 3 : 2;
}

export function countActiveCategoryFilters(filters: CategoryListFilters): number {
  return filters.status === 'all' ? 0 : 1;
}

export type ActiveCategoryFilterChip = {
  key: string;
  label: string;
  clear: (prev: CategoryListFilters) => CategoryListFilters;
};

const STATUS_LABELS: Record<Exclude<CategoryStatusFilter, 'all'>, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
};

export function getActiveCategoryFilterChips(filters: CategoryListFilters): ActiveCategoryFilterChip[] {
  if (filters.status === 'all') return [];
  return [
    {
      key: 'status',
      label: STATUS_LABELS[filters.status],
      clear: (prev) => ({ ...prev, status: 'all' }),
    },
  ];
}

export function categoryFiltersToApiParams(filters: CategoryListFilters): { active?: number } {
  if (filters.status === 'active') return { active: 1 };
  if (filters.status === 'inactive') return { active: 0 };
  return {};
}

export function categoryListStats(items: { active?: boolean; products_count?: number | string | null }[]) {
  const active = items.filter((i) => i.active !== false).length;
  const productsTotal = items.reduce((sum, i) => sum + Number(i.products_count ?? 0), 0);
  return {
    total: items.length,
    active,
    inactive: Math.max(0, items.length - active),
    productsTotal,
  };
}
