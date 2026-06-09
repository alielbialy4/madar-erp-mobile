import type {
  InsightsBranchAggregate,
  InsightsBranchStockRow,
  InsightsCharts,
  InsightsInventory,
  InsightsMovementRow,
  InsightsMovements,
  InsightsProduct,
  InsightsPurchases,
  InsightsRange,
  InsightsReturns,
  InsightsSales,
  InsightsSupplierAggregate,
  InsightsTimeBucket,
  InsightsWarehouseStockRow,
  MovementType,
  ProductInsightsPayload,
  StockStatus,
  ViewMode,
} from '@/types/productInsights';

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asString(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value);
}

function asNullableString(value: unknown): string | null {
  if (value == null || value === '') return null;
  return String(value);
}

function asStockStatus(value: unknown): StockStatus {
  if (value === 'low_stock' || value === 'out_of_stock') return value;
  return 'available';
}

function asMovementType(value: unknown): MovementType {
  const allowed: MovementType[] = [
    'sale',
    'refund',
    'purchase',
    'purchase_return',
    'transfer',
    'adjustment',
    'stock_count',
    'damage',
    'manual_in',
    'manual_out',
  ];
  return allowed.includes(value as MovementType) ? (value as MovementType) : 'adjustment';
}

function parseTimeBuckets(raw: unknown): InsightsTimeBucket[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      date: asString(row.date),
      qty: asNumber(row.qty),
      amount: asNumber(row.amount),
    };
  });
}

function parseBranchAggregates(raw: unknown): InsightsBranchAggregate[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      branch_id: asNullableString(row.branch_id),
      branch_name: asNullableString(row.branch_name),
      qty: asNumber(row.qty),
      amount: asNumber(row.amount),
    };
  });
}

function parseSupplierAggregates(raw: unknown): InsightsSupplierAggregate[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      supplier_id: row.supplier_id == null ? null : asNumber(row.supplier_id),
      supplier_name: asNullableString(row.supplier_name),
      qty: asNumber(row.qty),
      amount: asNumber(row.amount),
    };
  });
}

function parseProduct(raw: unknown): InsightsProduct {
  const p = (raw ?? {}) as Record<string, unknown>;
  const category = p.category as Record<string, unknown> | null;
  const barcodes = Array.isArray(p.barcodes) ? p.barcodes.map((b) => String(b)) : [];
  return {
    id: asNumber(p.id),
    name: asString(p.name, 'منتج'),
    barcode: asNullableString(p.barcode),
    barcodes,
    description: asNullableString(p.description),
    category:
      category && category.id != null
        ? { id: asNumber(category.id), name: asString(category.name) }
        : null,
    image: asNullableString(p.image),
    cost_price: asNumber(p.cost_price),
    selling_price: asNumber(p.selling_price),
    effective_price: asNumber(p.effective_price),
    tax_rate: asNumber(p.tax_rate),
    is_active: Boolean(p.is_active),
    featured: Boolean(p.featured),
    track_inventory: p.track_inventory !== false,
    min_stock_alert: asNumber(p.min_stock_alert),
    is_promotional: Boolean(p.is_promotional),
    promotional_price: p.promotional_price == null ? null : asNumber(p.promotional_price),
    created_at: asNullableString(p.created_at),
    updated_at: asNullableString(p.updated_at),
  };
}

function parseBranchStock(raw: unknown): InsightsBranchStockRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      branch_id: asNullableString(row.branch_id),
      branch_name: asNullableString(row.branch_name),
      quantity: asNumber(row.quantity),
      warehouses_count: asNumber(row.warehouses_count),
      last_movement_at: asNullableString(row.last_movement_at),
      status: asStockStatus(row.status),
    };
  });
}

function parseWarehouseStock(raw: unknown): InsightsWarehouseStockRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      warehouse_id: asString(row.warehouse_id),
      warehouse_name: asString(row.warehouse_name, 'مخزن'),
      warehouse_code: asNullableString(row.warehouse_code),
      branch_id: asNullableString(row.branch_id),
      branch_name: asNullableString(row.branch_name),
      quantity: asNumber(row.quantity),
      last_movement_at: asNullableString(row.last_movement_at),
      status: asStockStatus(row.status),
    };
  });
}

function parseInventory(raw: unknown): InsightsInventory {
  const inv = (raw ?? {}) as Record<string, unknown>;
  return {
    total_quantity: asNumber(inv.total_quantity),
    branches: parseBranchStock(inv.branches),
    warehouses: parseWarehouseStock(inv.warehouses),
    branches_count: asNumber(inv.branches_count),
    warehouses_count: asNumber(inv.warehouses_count),
  };
}

function parseSales(raw: unknown): InsightsSales {
  const s = (raw ?? {}) as Record<string, unknown>;
  const top = s.top_branch as Record<string, unknown> | null;
  return {
    qty_sold: asNumber(s.qty_sold),
    total_amount: asNumber(s.total_amount),
    avg_unit_price: asNumber(s.avg_unit_price),
    last_sale_at: asNullableString(s.last_sale_at),
    orders_count: asNumber(s.orders_count),
    top_branch: top
      ? {
          branch_id: asNullableString(top.branch_id),
          branch_name: asNullableString(top.branch_name),
          qty: asNumber(top.qty),
          amount: asNumber(top.amount),
        }
      : null,
    by_day: parseTimeBuckets(s.by_day),
    by_branch: parseBranchAggregates(s.by_branch),
  };
}

function parsePurchases(raw: unknown): InsightsPurchases {
  const p = (raw ?? {}) as Record<string, unknown>;
  return {
    qty_purchased: asNumber(p.qty_purchased),
    total_cost: asNumber(p.total_cost),
    avg_unit_cost: asNumber(p.avg_unit_cost),
    last_purchase_at: asNullableString(p.last_purchase_at),
    purchase_count: asNumber(p.purchase_count),
    top_suppliers: parseSupplierAggregates(p.top_suppliers),
    by_day: parseTimeBuckets(p.by_day),
    by_branch: parseBranchAggregates(p.by_branch),
  };
}

function parseReturns(raw: unknown): InsightsReturns {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    qty_refunded: asNumber(r.qty_refunded),
    refund_amount: asNumber(r.refund_amount),
    qty_returned_to_supplier: asNumber(r.qty_returned_to_supplier),
    supplier_return_amount: asNumber(r.supplier_return_amount),
    return_rate: r.return_rate == null ? null : asNumber(r.return_rate),
    last_return_at: asNullableString(r.last_return_at),
  };
}

function parseMovements(raw: unknown): InsightsMovements {
  const m = (raw ?? {}) as Record<string, unknown>;
  const pagination = (m.pagination ?? {}) as Record<string, unknown>;
  const data: InsightsMovementRow[] = Array.isArray(m.data)
    ? m.data.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: asString(row.id),
          occurred_at: asNullableString(row.occurred_at),
          delta: asNumber(row.delta),
          movement_type: asMovementType(row.movement_type),
          reference_type: asNullableString(row.reference_type),
          reference_id: asNullableString(row.reference_id),
          reference_parent_id: asNullableString(row.reference_parent_id),
          warehouse_id: asNullableString(row.warehouse_id),
          warehouse_name: asNullableString(row.warehouse_name),
          branch_id: asNullableString(row.branch_id),
          branch_name: asNullableString(row.branch_name),
        };
      })
    : [];
  return {
    data,
    pagination: {
      total: asNumber(pagination.total),
      per_page: asNumber(pagination.per_page, 15),
      current_page: asNumber(pagination.current_page, 1),
      last_page: asNumber(pagination.last_page, 1),
    },
  };
}

function parseCharts(raw: unknown): InsightsCharts {
  const c = (raw ?? {}) as Record<string, unknown>;
  const stockByBranch = Array.isArray(c.stock_by_branch)
    ? c.stock_by_branch.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          branch_id: asNullableString(row.branch_id),
          label: asString(row.label, 'فرع'),
          qty: asNumber(row.qty),
        };
      })
    : [];
  const stockByWarehouse = Array.isArray(c.stock_by_warehouse)
    ? c.stock_by_warehouse.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          warehouse_id: asString(row.warehouse_id),
          label: asString(row.label, 'مخزن'),
          qty: asNumber(row.qty),
        };
      })
    : [];
  const movementsOverTime = Array.isArray(c.movements_over_time)
    ? c.movements_over_time.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          date: asString(row.date),
          inbound: asNumber(row.inbound),
          outbound: asNumber(row.outbound),
        };
      })
    : [];
  const topBranches = Array.isArray(c.top_branches_by_sales)
    ? c.top_branches_by_sales.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          branch_id: asNullableString(row.branch_id),
          label: asString(row.label, 'فرع'),
          qty: asNumber(row.qty),
          amount: asNumber(row.amount),
        };
      })
    : [];
  return {
    stock_by_branch: stockByBranch,
    stock_by_warehouse: stockByWarehouse,
    movements_over_time: movementsOverTime,
    top_branches_by_sales: topBranches,
  };
}

function parseRange(raw: unknown): InsightsRange {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    from: asString(r.from),
    to: asString(r.to),
  };
}

function parsePayload(raw: unknown): ProductInsightsPayload {
  const d = (raw ?? {}) as Record<string, unknown>;
  return {
    product: parseProduct(d.product),
    inventory: parseInventory(d.inventory),
    sales: parseSales(d.sales),
    purchases: parsePurchases(d.purchases),
    returns: parseReturns(d.returns),
    movements: parseMovements(d.movements),
    charts: parseCharts(d.charts),
    range: parseRange(d.range),
  };
}

export function parseProductInsightsResponse(raw: unknown): {
  payload: ProductInsightsPayload;
  viewMode: ViewMode;
} {
  const envelope = (raw ?? {}) as Record<string, unknown>;
  const viewMode: ViewMode = envelope.view_mode === 'global' ? 'global' : 'branch';
  const dataNode = envelope.data ?? envelope;
  const payload = parsePayload(dataNode);
  return { payload, viewMode };
}
