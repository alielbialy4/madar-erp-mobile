import type { InventoryListSurface } from '@/components/inventory/inventoryListPresets';

export const INVENTORY_FILTER_SIDEBAR_WIDTH = 272;

export type WarehouseStatusFilter = 'all' | 'active' | 'inactive';

export function warehouseFiltersToApi(
  status: string | null,
): { status?: string } {
  if (!status || status === 'all') return {};
  return { status };
}

export type InventoryListFilters = {
  status: string | null;
  warehouse_id: string | null;
  product_id: string | null;
  movement_type: string | null;
  direction: string | null;
  date_from: string | null;
  date_to: string | null;
  near_expiry_only: boolean;
  expired_only: boolean;
  low_stock_only: boolean;
  branch_id: string | null;
  stock_status: string | null;
};

export const EMPTY_INVENTORY_FILTERS: InventoryListFilters = {
  status: null,
  warehouse_id: null,
  product_id: null,
  movement_type: null,
  direction: null,
  date_from: null,
  date_to: null,
  near_expiry_only: false,
  expired_only: false,
  low_stock_only: false,
  branch_id: null,
  stock_status: null,
};

export type InventoryScopeContext = {
  isGlobalView: boolean;
  effectiveBranchId?: string | null;
};

export function getInventoryGridColumns(width: number, height: number): number {
  const isTablet = width >= 900;
  const isLandscape = width > height;
  if (!isTablet) return isLandscape && width >= 600 ? 2 : 1;
  return isLandscape ? 3 : 2;
}

export function warehouseStatusToApi(status: WarehouseStatusFilter): { status?: string } {
  if (status === 'active') return { status: 'active' };
  if (status === 'inactive') return { status: 'inactive' };
  return {};
}

export function countActiveInventoryFilters(
  surface: InventoryListSurface,
  filters: InventoryListFilters,
): number {
  let count = 0;
  if (filters.status) count += 1;
  if (filters.warehouse_id) count += 1;
  if (filters.product_id) count += 1;
  if (filters.movement_type) count += 1;
  if (filters.direction) count += 1;
  if (filters.date_from || filters.date_to) count += 1;
  if (filters.branch_id && surface === 'reorderRules') count += 1;
  if (filters.low_stock_only && surface === 'balances') count += 1;
  if (filters.near_expiry_only && surface === 'expiry') count += 1;
  if (filters.expired_only && surface === 'expiry') count += 1;
  if (filters.stock_status && surface === 'products') count += 1;
  return count;
}

export type ActiveInventoryFilterChip = {
  key: string;
  label: string;
  clear: (prev: InventoryListFilters) => InventoryListFilters;
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  pending: 'معلّق',
  submitted: 'مُرسَل',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
  completed: 'مكتمل',
  cancelled: 'ملغى',
  in_transit: 'قيد النقل',
  posted: 'مُرحّل',
  active: 'نشط',
  inactive: 'غير نشط',
};

export function getActiveInventoryFilterChips(
  surface: InventoryListSurface,
  filters: InventoryListFilters,
  warehouseName?: string,
): ActiveInventoryFilterChip[] {
  const chips: ActiveInventoryFilterChip[] = [];
  if (filters.status) {
    chips.push({
      key: 'status',
      label: STATUS_LABELS[filters.status] ?? filters.status,
      clear: (prev) => ({ ...prev, status: null }),
    });
  }
  if (filters.warehouse_id) {
    chips.push({
      key: 'warehouse',
      label: warehouseName ?? 'مخزن',
      clear: (prev) => ({ ...prev, warehouse_id: null }),
    });
  }
  if (filters.product_id) {
    chips.push({
      key: 'product',
      label: `منتج #${filters.product_id}`,
      clear: (prev) => ({ ...prev, product_id: null }),
    });
  }
  if (filters.movement_type) {
    chips.push({
      key: 'movement_type',
      label: filters.movement_type,
      clear: (prev) => ({ ...prev, movement_type: null }),
    });
  }
  if (filters.direction) {
    chips.push({
      key: 'direction',
      label: filters.direction === 'in' ? 'إدخال' : 'إخراج',
      clear: (prev) => ({ ...prev, direction: null }),
    });
  }
  if (filters.low_stock_only && surface === 'balances') {
    chips.push({
      key: 'low_stock',
      label: 'مخزون منخفض',
      clear: (prev) => ({ ...prev, low_stock_only: false }),
    });
  }
  if (filters.stock_status && surface === 'products') {
    chips.push({
      key: 'stock_status',
      label: filters.stock_status,
      clear: (prev) => ({ ...prev, stock_status: null }),
    });
  }
  if (filters.near_expiry_only && surface === 'expiry') {
    chips.push({
      key: 'near_expiry',
      label: 'قريب الانتهاء',
      clear: (prev) => ({ ...prev, near_expiry_only: false }),
    });
  }
  if (filters.expired_only && surface === 'expiry') {
    chips.push({
      key: 'expired',
      label: 'منتهي',
      clear: (prev) => ({ ...prev, expired_only: false }),
    });
  }
  return chips;
}

export function inventoryFiltersToApiParams(
  surface: InventoryListSurface,
  filters: InventoryListFilters,
  scope: InventoryScopeContext,
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (filters.status) params.status = filters.status;
  if (filters.warehouse_id) params.warehouse_id = filters.warehouse_id;
  if (filters.product_id) params.product_id = Number(filters.product_id);
  if (filters.movement_type) params.movement_type = filters.movement_type;
  if (filters.direction) params.direction = filters.direction;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.low_stock_only && surface === 'balances') params.low_stock_only = 1;
  if (filters.near_expiry_only && surface === 'expiry') params.near_expiry_only = 1;
  if (filters.expired_only && surface === 'expiry') params.expired_only = 1;
  if (filters.stock_status && surface === 'products') params.status = filters.stock_status;
  if (filters.branch_id && scope.isGlobalView) params.branch_id = filters.branch_id;
  else if (!scope.isGlobalView && scope.effectiveBranchId && surface === 'requisitions') {
    params.branch_id = scope.effectiveBranchId;
  }
  return params;
}

export function warehouseListStats(items: { status?: string; products_count?: number | string | null }[]) {
  const active = items.filter((w) => w.status !== 'inactive').length;
  const productsTotal = items.reduce((sum, w) => sum + Number(w.products_count ?? 0), 0);
  return { total: items.length, active, inactive: Math.max(0, items.length - active), productsTotal };
}
