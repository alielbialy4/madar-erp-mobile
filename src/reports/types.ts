import type MaterialIcons from '@expo/vector-icons/MaterialIcons';

export type ReportGroupId =
  | 'sales'
  | 'inventory'
  | 'purchases'
  | 'customers'
  | 'suppliers'
  | 'finance'
  | 'marketing'
  | 'operations'
  | 'other';

export type ReportId =
  | 'sales-dashboard'
  | 'sales-refunds'
  | 'sales-returns-by-product'
  | 'purchase-returns-by-product'
  | 'sales-tax'
  | 'sales-layaway'
  | 'sales-hourly'
  | 'inventory-valuation'
  | 'inventory-movements'
  | 'inventory-expiry'
  | 'raw-material-stock'
  | 'raw-material-low-stock'
  | 'raw-material-expiry'
  | 'raw-material-purchases'
  | 'customers-aging'
  | 'suppliers-aging'
  | 'marketing-coupons'
  | 'marketing-promotions'
  | 'gift-cards'
  | 'treasury'
  | 'expenses'
  | 'dining'
  | 'delivery'
  | 'shifts'
  | 'saved-reports'
  | 'partner-performance'
  | 'legacy-comprehensive';

export type ReportFilterKey =
  | 'dateRange'
  | 'branch'
  | 'warehouse'
  | 'category'
  | 'product'
  | 'search'
  | 'couponCode'
  | 'status'
  | 'customer'
  | 'supplier'
  | 'cashier'
  | 'paymentMethod'
  | 'expiryOptions'
  | 'perPage';

export type ReportFilters = {
  from_date: string;
  to_date: string;
  branch_id: string;
  warehouse_id: string;
  category_id: string;
  product_id: string;
  customer_id: string;
  supplier_id: string;
  cashier_id: string;
  search: string;
  coupon_code: string;
  status: string;
  payment_method: string;
  page: number;
  per_page: number;
  days_threshold: number;
  expired_only: boolean;
  near_expiry_only: boolean;
};

export type ReportMetric = {
  key: string;
  label: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  format?: 'money' | 'number' | 'percent' | 'text';
};

export type ReportRowField = {
  key: string;
  label: string;
  format?: 'money' | 'number' | 'date' | 'text' | 'badge';
  primary?: boolean;
};

export type ReportRowSection = {
  id: string;
  title: string;
  extractRows: (payload: unknown) => Record<string, unknown>[];
  fields: ReportRowField[];
  titleKey?: string;
  metaKey?: string;
};

export type ReportDefinition = {
  id: ReportId;
  title: string;
  description: string;
  group: ReportGroupId;
  icon: keyof typeof MaterialIcons.glyphMap;
  webRoute: string;
  permission: string;
  feature?: string;
  apiMethod: string;
  useInventoryExpiry?: boolean;
  usePartnerApi?: boolean;
  filters: ReportFilterKey[];
  metrics: ReportMetric[];
  sections: ReportRowSection[];
  paginated?: boolean;
  /** Optional bar chart for a report section (matches web ApexCharts summaries). */
  chart?: { sectionId: string; labelKey: string; valueKey: string; valueFormat?: 'money' | 'number' };
  exportSupported?: boolean;
  /** POST /reports/export `type` when exportSupported */
  exportType?: string;
  lockedReason?: string;
};

export type ReportHubItem = Pick<
  ReportDefinition,
  'id' | 'title' | 'description' | 'group' | 'icon' | 'webRoute' | 'permission' | 'feature'
>;
