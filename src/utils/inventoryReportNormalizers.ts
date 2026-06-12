import { extractData } from '@/utils/data';

export type ReportPagination = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
};

export type TabbedReportData = {
  meta: Record<string, unknown>;
  summary: Record<string, unknown>;
  comparison: Record<string, unknown> | null;
  rows: Record<string, unknown>[];
  pagination: ReportPagination;
  by_role?: Record<string, unknown>[];
  by_supplier?: Record<string, unknown>[];
  by_product?: Record<string, unknown>[];
  by_ingredient?: Record<string, unknown>[];
  by_status?: Record<string, unknown>[];
  by_warehouse?: Record<string, unknown>[];
  by_category?: Record<string, unknown>[];
  daily?: Record<string, unknown>[];
  grand_total_value?: number;
};


function unwrapPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  const data = extractData<Record<string, unknown>>(payload as never);
  return (data ?? payload) as Record<string, unknown>;
}

function normalizePagination(payload: Record<string, unknown>, previous?: ReportPagination): ReportPagination {
  const p = (payload.pagination ?? {}) as Record<string, unknown>;
  return {
    total: Number(p.total ?? previous?.total ?? 0),
    per_page: Number(p.per_page ?? previous?.per_page ?? 50),
    current_page: Number(p.current_page ?? previous?.current_page ?? 1),
    last_page: Number(p.last_page ?? previous?.last_page ?? 1),
  };
}

function normalizeComparison(payload: Record<string, unknown>, previous: TabbedReportData | null | undefined) {
  if (payload.comparison !== undefined) {
    const c = payload.comparison;
    return c && typeof c === 'object' ? (c as Record<string, unknown>) : null;
  }
  return previous?.comparison ?? null;
}

export function normalizeRawMaterialsReport(payload: unknown, tab: string, previous?: TabbedReportData | null): TabbedReportData {
  const root = unwrapPayload(payload);
  return {
    meta: {
      tab: root.meta && typeof root.meta === 'object' ? (root.meta as Record<string, unknown>).tab ?? tab : tab,
      from_date: (root.meta as Record<string, unknown> | undefined)?.from_date ?? previous?.meta.from_date ?? null,
      to_date: (root.meta as Record<string, unknown> | undefined)?.to_date ?? previous?.meta.to_date ?? null,
    },
    summary: (root.summary as Record<string, unknown>) ?? previous?.summary ?? {},
    comparison: normalizeComparison(root, previous),
    by_role: Array.isArray(root.by_role) ? root.by_role : (previous?.by_role ?? []),
    by_supplier: Array.isArray(root.by_supplier) ? root.by_supplier : (previous?.by_supplier ?? []),
    daily: Array.isArray(root.daily) ? root.daily : (previous?.daily ?? []),
    rows: Array.isArray(root.rows) ? root.rows : (previous?.rows ?? []),
    pagination: normalizePagination(root, previous?.pagination),
  };
}

export function normalizeRecipesReport(payload: unknown, tab: string, previous?: TabbedReportData | null): TabbedReportData {
  const root = unwrapPayload(payload);
  const meta = (root.meta ?? {}) as Record<string, unknown>;
  return {
    meta: {
      tab: meta.tab ?? tab,
      from_date: meta.from_date ?? previous?.meta.from_date ?? null,
      to_date: meta.to_date ?? previous?.meta.to_date ?? null,
      cost_policy: meta.cost_policy ?? root.cost_policy ?? previous?.meta.cost_policy,
      note: root.note ?? previous?.meta.note,
    },
    summary: (root.summary as Record<string, unknown>) ?? previous?.summary ?? {},
    comparison: normalizeComparison(root, previous),
    by_product: Array.isArray(root.by_product) ? root.by_product : (previous?.by_product ?? []),
    by_ingredient: Array.isArray(root.by_ingredient) ? root.by_ingredient : (previous?.by_ingredient ?? []),
    daily: Array.isArray(root.daily) ? root.daily : (previous?.daily ?? []),
    rows: Array.isArray(root.rows) ? root.rows : (previous?.rows ?? []),
    pagination: normalizePagination(root, previous?.pagination),
  };
}

export function normalizeMovementsReport(payload: unknown, previous?: TabbedReportData | null): TabbedReportData {
  const root = unwrapPayload(payload);
  const summary = (root.summary ?? {}) as Record<string, unknown>;
  const meta = (root.meta ?? {}) as Record<string, unknown>;
  return {
    meta: {
      from_date: meta.from_date ?? previous?.meta.from_date ?? null,
      to_date: meta.to_date ?? previous?.meta.to_date ?? null,
      movement_type: meta.movement_type ?? previous?.meta.movement_type ?? 'all',
    },
    summary: {
      transfers_count: Number(summary.transfers_count ?? root.transfers_count ?? previous?.summary.transfers_count ?? 0),
      adjustments_count: Number(summary.adjustments_count ?? root.adjustments_count ?? previous?.summary.adjustments_count ?? 0),
      total_items_moved: Number(summary.total_items_moved ?? previous?.summary.total_items_moved ?? 0),
      net_transfers: Number(summary.net_transfers ?? previous?.summary.net_transfers ?? 0),
    },
    comparison: normalizeComparison(root, previous),
    daily: Array.isArray(root.daily) ? root.daily : (previous?.daily ?? []),
    by_status: Array.isArray(root.by_status) ? root.by_status : (previous?.by_status ?? []),
    by_warehouse: Array.isArray(root.by_warehouse) ? root.by_warehouse : (previous?.by_warehouse ?? []),
    rows: Array.isArray(root.rows) ? root.rows : (previous?.rows ?? []),
    pagination: normalizePagination(root, previous?.pagination),
  };
}

export function normalizeExpiryReport(payload: unknown, previous?: TabbedReportData | null): TabbedReportData {
  const root = unwrapPayload(payload);
  const summary = (root.summary ?? {}) as Record<string, unknown>;
  const meta = (root.meta ?? {}) as Record<string, unknown>;
  return {
    meta: {
      days_threshold: meta.days_threshold ?? previous?.meta.days_threshold ?? 30,
      product_id: meta.product_id ?? previous?.meta.product_id ?? null,
      warehouse_id: meta.warehouse_id ?? previous?.meta.warehouse_id ?? null,
      branch_id: meta.branch_id ?? previous?.meta.branch_id ?? null,
    },
    summary: {
      total_qty: Number(summary.total_qty ?? previous?.summary.total_qty ?? 0),
      expired_qty: Number(summary.expired_qty ?? previous?.summary.expired_qty ?? 0),
      near_expiry_qty: Number(summary.near_expiry_qty ?? previous?.summary.near_expiry_qty ?? 0),
      valid_qty: Number(summary.valid_qty ?? previous?.summary.valid_qty ?? 0),
      batch_count: Number(summary.batch_count ?? previous?.summary.batch_count ?? 0),
      product_count: Number(summary.product_count ?? previous?.summary.product_count ?? 0),
      unbatched_qty: Number(summary.unbatched_qty ?? previous?.summary.unbatched_qty ?? 0),
      unbatched_product_count: Number(summary.unbatched_product_count ?? previous?.summary.unbatched_product_count ?? 0),
    },
    comparison: null,
    by_status: Array.isArray(root.by_status) ? root.by_status : (previous?.by_status ?? []),
    by_warehouse: Array.isArray(root.by_warehouse) ? root.by_warehouse : (previous?.by_warehouse ?? []),
    rows: Array.isArray(root.rows) ? root.rows : (previous?.rows ?? []),
    pagination: normalizePagination(root, previous?.pagination),
  };
}

export function normalizeValuationReport(payload: unknown, previous?: TabbedReportData | null): TabbedReportData {
  const root = unwrapPayload(payload);
  const summary = (root.summary ?? {}) as Record<string, unknown>;
  const meta = (root.meta ?? {}) as Record<string, unknown>;
  return {
    meta: {
      warehouse_id: meta.warehouse_id ?? previous?.meta.warehouse_id ?? null,
      category_id: meta.category_id ?? previous?.meta.category_id ?? null,
    },
    summary: {
      grand_total_value: Number(summary.grand_total_value ?? root.grand_total_value ?? previous?.summary.grand_total_value ?? 0),
      total_quantity: Number(summary.total_quantity ?? previous?.summary.total_quantity ?? 0),
      warehouse_count: Number(summary.warehouse_count ?? previous?.summary.warehouse_count ?? 0),
      product_count: Number(summary.product_count ?? previous?.summary.product_count ?? 0),
      avg_value_per_unit: Number(summary.avg_value_per_unit ?? previous?.summary.avg_value_per_unit ?? 0),
    },
    comparison: null,
    by_warehouse: Array.isArray(root.by_warehouse) ? root.by_warehouse : (previous?.by_warehouse ?? []),
    by_category: Array.isArray(root.by_category) ? root.by_category : (previous?.by_category ?? []),
    grand_total_value: Number(root.grand_total_value ?? summary.grand_total_value ?? previous?.grand_total_value ?? 0),
    rows: Array.isArray(root.rows) ? root.rows : (previous?.rows ?? []),
    pagination: normalizePagination(root, previous?.pagination),
  };
}
