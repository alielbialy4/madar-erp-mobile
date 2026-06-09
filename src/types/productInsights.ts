export type ViewMode = 'global' | 'branch';

export type StockStatus = 'available' | 'low_stock' | 'out_of_stock';

export type MovementType =
  | 'sale'
  | 'refund'
  | 'purchase'
  | 'purchase_return'
  | 'transfer'
  | 'adjustment'
  | 'stock_count'
  | 'damage'
  | 'manual_in'
  | 'manual_out';

export interface InsightsRange {
  from: string;
  to: string;
}

export interface InsightsProduct {
  id: number;
  name: string;
  barcode: string | null;
  barcodes: string[];
  description: string | null;
  category: { id: number; name: string } | null;
  image: string | null;
  cost_price: number;
  selling_price: number;
  effective_price: number;
  tax_rate: number;
  is_active: boolean;
  featured: boolean;
  track_inventory: boolean;
  min_stock_alert: number;
  is_promotional: boolean;
  promotional_price: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface InsightsBranchStockRow {
  branch_id: string | null;
  branch_name: string | null;
  quantity: number;
  warehouses_count: number;
  last_movement_at: string | null;
  status: StockStatus;
}

export interface InsightsWarehouseStockRow {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string | null;
  branch_id: string | null;
  branch_name: string | null;
  quantity: number;
  last_movement_at: string | null;
  status: StockStatus;
}

export interface InsightsInventory {
  total_quantity: number;
  branches: InsightsBranchStockRow[];
  warehouses: InsightsWarehouseStockRow[];
  branches_count: number;
  warehouses_count: number;
}

export interface InsightsTimeBucket {
  date: string;
  qty: number;
  amount: number;
}

export interface InsightsBranchAggregate {
  branch_id: string | null;
  branch_name: string | null;
  qty: number;
  amount: number;
}

export interface InsightsSales {
  qty_sold: number;
  total_amount: number;
  avg_unit_price: number;
  last_sale_at: string | null;
  orders_count: number;
  top_branch: InsightsBranchAggregate | null;
  by_day: InsightsTimeBucket[];
  by_branch: InsightsBranchAggregate[];
}

export interface InsightsSupplierAggregate {
  supplier_id: number | null;
  supplier_name: string | null;
  qty: number;
  amount: number;
}

export interface InsightsPurchases {
  qty_purchased: number;
  total_cost: number;
  avg_unit_cost: number;
  last_purchase_at: string | null;
  purchase_count: number;
  top_suppliers: InsightsSupplierAggregate[];
  by_day: InsightsTimeBucket[];
  by_branch: InsightsBranchAggregate[];
}

export interface InsightsReturns {
  qty_refunded: number;
  refund_amount: number;
  qty_returned_to_supplier: number;
  supplier_return_amount: number;
  return_rate: number | null;
  last_return_at: string | null;
}

export interface InsightsMovementRow {
  id: string;
  occurred_at: string | null;
  delta: number;
  movement_type: MovementType;
  reference_type: string | null;
  reference_id: string | null;
  reference_parent_id?: string | null;
  warehouse_id: string | null;
  warehouse_name: string | null;
  branch_id: string | null;
  branch_name: string | null;
}

export interface InsightsMovements {
  data: InsightsMovementRow[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface InsightsCharts {
  stock_by_branch: Array<{ branch_id: string | null; label: string; qty: number }>;
  stock_by_warehouse: Array<{ warehouse_id: string; label: string; qty: number }>;
  movements_over_time: Array<{ date: string; inbound: number; outbound: number }>;
  top_branches_by_sales: Array<{
    branch_id: string | null;
    label: string;
    qty: number;
    amount: number;
  }>;
}

export interface ProductInsightsPayload {
  product: InsightsProduct;
  inventory: InsightsInventory;
  sales: InsightsSales;
  purchases: InsightsPurchases;
  returns: InsightsReturns;
  movements: InsightsMovements;
  charts: InsightsCharts;
  range: InsightsRange;
}

export interface ProductInsightsResponse {
  status: string;
  view_mode: ViewMode;
  data: ProductInsightsPayload;
}
