export type ID = string | number;

export type ApiStatus = 'success' | 'error' | string;

export type PaginationMeta = {
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
};

export type ApiEnvelope<T = unknown> = {
  status?: ApiStatus;
  message?: string;
  data?: T;
  errors?: Record<string, string[] | string>;
  pagination?: PaginationMeta;
  meta?: Record<string, unknown>;
};

export type ListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  q?: string;
  branch_id?: string | null;
  status?: string;
  from_date?: string;
  to_date?: string;
  [key: string]: unknown;
};

export type Branch = {
  id: string;
  name: string;
  code?: string | null;
  is_main?: boolean;
  settings?: Record<string, unknown> | null;
};

export type PlanAccess = {
  can_operate?: boolean;
  features?: string[];
  enabled_features?: string[];
  limits?: Record<string, unknown>;
  is_tenant_active?: boolean;
  is_subscription_valid?: boolean;
};

export type User = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  active?: boolean;
  current_branch_id?: string | null;
  current_branch?: Branch | null;
  branch_ids?: string[];
  has_global_view?: boolean;
  can_use_global_view?: boolean;
  permissions_version?: number;
  roles?: string[];
  permissions?: string[];
  is_super_admin?: boolean;
  plan_access?: PlanAccess | null;
  token?: string;
};

export type AuthSession = {
  token: string;
  user: User;
  tenant_slug?: string;
};

export type PickedImage = {
  uri: string;
  name?: string;
  mimeType?: string;
};

export type InventoryMode = 'stock_product' | 'recipe_product' | 'non_stock';
export type ProductRole = 'sellable_product' | 'raw_material' | 'packaging_material' | 'semi_finished' | 'service';

export type ProductUnit = {
  id: number;
  name: string;
  factor_to_base?: number | string;
  is_base?: boolean;
  barcode?: string | null;
};

export type ProductRecipe = {
  id: number;
  variant_id?: string | null;
  modifier_option_id?: number | null;
  ingredient_product_id: number;
  ingredient_product?: {
    id: number;
    name: string;
    avg_cost?: number | string | null;
    cost_price?: number | string | null;
    units?: ProductUnit[];
  } | null;
  quantity: number | string;
  unit_id: number;
  unit?: ProductUnit | null;
  waste_percentage?: number | string | null;
  warehouse_id?: string | null;
  is_active?: boolean;
};

export type ProductRecipeInput = {
  id?: number;
  variant_id?: string | null;
  modifier_option_id?: number | null;
  ingredient_product_id: number;
  ingredient_product?: ProductRecipe['ingredient_product'];
  quantity: number;
  unit_id: number;
  unit?: ProductUnit | null;
  waste_percentage?: number;
  warehouse_id?: string | null;
  is_active?: boolean;
};

export type Product = {
  id: number;
  name: string;
  barcode?: string | null;
  barcodes?: string[] | null;
  description?: string | null;
  selling_price?: number | string;
  cost_price?: number | string | null;
  category_id?: number | null;
  category?: { id: number; name: string } | null;
  image?: string | null;
  stock_quantity?: number;
  branch_available_quantity?: number;
  available_quantity?: number;
  min_stock_alert?: number;
  unit?: string | null;
  units?: ProductUnit[];
  inventory_mode?: InventoryMode;
  product_role?: ProductRole;
  is_sellable?: boolean;
  is_purchasable?: boolean;
  is_recipe_ingredient?: boolean;
  track_inventory?: boolean;
  track_expiry?: boolean;
  track_batch?: boolean;
  preferred_supplier_id?: number | null;
  default_warehouse_id?: string | null;
  storage_type?: string | null;
  default_shelf_life_days?: number | null;
  specs?: Record<string, string | number | null>;
  active?: boolean;
  is_active?: boolean;
  featured?: boolean;
  is_promotional?: boolean;
  promotional_price?: number | string | null;
  promotional_start_date?: string | null;
  promotional_end_date?: string | null;
  option_groups?: ProductOptionGroup[];
  variants?: { id: string; name?: string; sku?: string | null; additional_price?: number | string | null }[];
  recipes?: ProductRecipe[];
  recipe_costing?: {
    recipe_cost?: number;
    sale_price?: number;
    gross_margin?: number;
    margin_percentage?: number | null;
  };
};

export type ProductOptionGroup = {
  id: number;
  title: string;
  name?: string;
  selection_type: 'single' | 'multiple';
  pricing_type: 'free' | 'per_option' | 'group_price';
  group_price?: number | string | null;
  is_required?: boolean;
  min_selections?: number | null;
  max_selections?: number | null;
  sort_order?: number;
  is_active?: boolean;
  options?: { id: number; name: string; price?: number | string; sort_order?: number; is_active?: boolean }[];
};

export type ProductOptionInput = {
  id?: number;
  name: string;
  price?: number;
  sort_order?: number;
  is_active?: boolean;
};

export type ProductOptionGroupInput = {
  id?: number;
  title: string;
  selection_type: 'single' | 'multiple';
  pricing_type: 'free' | 'per_option' | 'group_price';
  group_price?: number | null;
  is_required?: boolean;
  min_selections?: number | null;
  max_selections?: number | null;
  sort_order?: number;
  is_active?: boolean;
  options: ProductOptionInput[];
};

export type ProductUnitInput = {
  id?: number;
  name: string;
  factor_to_base: number;
  is_base: boolean;
  barcode?: string;
};

export type OpeningStockInput = {
  warehouse_id: string;
  quantity: number;
  unit_index?: number;
};

export type ProductPayload = {
  name: string;
  barcode?: string;
  barcodes?: string[];
  description?: string;
  category_id?: number | null;
  cost_price: number;
  selling_price: number;
  min_stock_alert: number;
  inventory_mode?: InventoryMode;
  product_role?: ProductRole;
  is_sellable?: boolean;
  is_purchasable?: boolean;
  is_recipe_ingredient?: boolean;
  track_inventory?: boolean;
  track_expiry?: boolean;
  track_batch?: boolean;
  preferred_supplier_id?: number | null;
  default_warehouse_id?: string | null;
  storage_type?: string | null;
  default_shelf_life_days?: number | null;
  specs?: Record<string, string | number | null | undefined>;
  active?: boolean;
  featured?: boolean;
  is_promotional?: boolean;
  promotional_price?: number;
  promotional_start_date?: string;
  promotional_end_date?: string;
  image?: PickedImage | null;
  units: ProductUnitInput[];
  opening_stock?: OpeningStockInput[];
  option_groups?: ProductOptionGroupInput[];
  recipes?: ProductRecipeInput[];
};

export type Category = {
  id: number;
  name: string;
  description?: string | null;
  active?: boolean;
  image?: string | null;
  parent_id?: number | null;
  sort_order?: number;
  products_count?: number;
};

export type ProductInsightsParams = {
  from?: string;
  to?: string;
  movements_page?: number;
  movements_per_page?: number;
};

export type ProductInsightsPayload = Record<string, unknown>;

export type Customer = {
  id: number;
  name: string;
  phone?: string | null;
  primary_phone?: string | null;
  email?: string | null;
  balance?: number | string | null;
  debt?: number | string | null;
  credit_limit?: number | string | null;
  wallet_balance?: number | string | null;
  points_balance?: number;
  addresses?: CustomerAddress[];
  default_address?: CustomerAddress | null;
  latest_order?: Record<string, unknown> | null;
};

export type CustomerAddress = {
  id: string;
  label?: string | null;
  address_line_1?: string | null;
  area?: string | null;
  city?: string | null;
  is_default?: boolean;
  delivery_fee?: number | string | null;
};

export type SaleItemPayload = {
  product_id: number;
  quantity: number;
  unit_price: number;
  discount?: number;
  unit_id?: number | null;
  variant_id?: string | null;
  selected_options?: { product_option_group_id: number; option_ids: number[] }[];
};

export type SalePayload = {
  /** Idempotency key for online create / offline sync. */
  client_uuid?: string;
  shift_id?: string | null;
  customer_id?: number | null;
  items: SaleItemPayload[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  paid: number;
  payment_type: 'cash' | 'card' | 'credit' | 'layaway' | 'split' | 'wallet' | 'electronic_wallet' | 'instapay';
  notes?: string;
  warehouse_id?: string | null;
  order_type?: 'dine_in' | 'takeaway' | 'delivery';
  dining_table_id?: string | null;
  delivery_fee?: number;
  delivery_address?: string;
  delivery_phone?: string;
  coupon_id?: string | null;
  coupon_discount?: number;
  promotion_discount?: number;
  loyalty_points_redeemed?: number;
  loyalty_discount?: number;
  payment_lines?: { vault_id: string; amount: number; payment_method?: string }[] | null;
  layaway_terms?: LayawayTerms | null;
  delivery_zone_id?: string | null;
  service_charge?: number;
};

/** POS UI may use gift_card; server sale uses cash/card + post-sale redeem API. */
export type PosCheckoutPaymentType = SalePayload['payment_type'] | 'gift_card';

export type Sale = {
  id: number;
  invoice_number?: string | null;
  print_sequence?: number | null;
  dining_table_id?: string | null;
  total?: number | string;
  subtotal?: number | string;
  paid?: number | string;
  status?: string;
  payment_type?: string;
  order_type?: string;
  created_at?: string;
  customer?: Customer | null;
  items?: Record<string, unknown>[];
};

export type PosCatalog = {
  generated_at?: string;
  version?: number;
  branch_id?: string;
  branch?: Branch | null;
  pagination?: {
    products?: { current_page: number; last_page: number; per_page?: number; total?: number };
  };
  products: Product[];
  categories: Category[];
  customers: Customer[];
  coupons?: Coupon[];
  promotions?: CatalogPromotion[];
  delivery_zones?: DeliveryZone[];
  vaults?: Vault[];
  warehouses?: Warehouse[];
  settings?: Record<string, unknown>;
  open_shift?: ActiveShift | null;
};

export type CatalogPromotion = {
  id: string;
  name: string;
  type: string;
  reward_value: string | number;
  config?: Record<string, unknown> | null;
  priority: number;
  branch_id?: string | null;
  conditions?: Array<{
    condition_type: string;
    condition_value?: Record<string, unknown> | null;
  }>;
};

export type DeliveryZone = {
  id: string;
  name: string;
  delivery_fee: number | string;
  branch_id?: string;
  is_active?: boolean;
};

export type Coupon = {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount?: number | null;
  max_discount_amount?: number | null;
  max_uses?: number | null;
  used_count?: number;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
  branch_id?: string | null;
};

export type LayawayTerms = {
  base_total: number;
  markup_percent: number;
  term_months: number;
  down_payment_amount: number;
  first_due_date: string;
};

export type Warehouse = {
  id: string;
  name: string;
  code?: string | null;
  location?: string | null;
  status?: string;
  branch?: Branch | null;
  products_count?: number;
  balances?: InventoryBalance[];
  created_at?: string;
  updated_at?: string;
};

export type InventoryBalance = {
  id: string;
  warehouse_id?: string;
  product_id?: number;
  product?: { id: number; name: string; barcode?: string | null };
  variant?: { id: string; sku?: string } | null;
  quantity?: number;
  warehouse_name?: string | null;
  branch_name?: string | null;
  category_name?: string | null;
  balance_status_label_ar?: string;
};

export type ActiveShift = {
  id: string;
  shift_no?: number | null;
  branch_id: string;
  vault_id: string;
  opened_at?: string;
  starting_cash?: string | number;
  expected_cash?: string | number | null;
  drawer_ledger_enabled?: boolean;
  accounting_model?: 'shift_drawer_ledger' | 'legacy_vault_shift';
  status?: string;
  vault?: Vault | null;
};

export type Vault = {
  id: string;
  name: string;
  code?: string | null;
  balance?: string | number;
  is_active?: boolean;
  branch?: Branch | null;
};

export type KitchenOrder = {
  id: number;
  invoice_number?: string | null;
  print_sequence?: number | null;
  status?: string;
  kitchen_status?: string | null;
  order_type?: string;
  total?: number | string;
  created_at?: string;
  wait_time?: number;
  is_overdue?: boolean;
  dining_table?: { id: string; name?: string; number?: string } | null;
  customer?: Customer | null;
  items?: Record<string, unknown>[];
};

export type DiningHall = {
  id: string;
  branch_id?: string;
  name: string;
  is_active?: boolean;
  tables?: DiningTable[];
};

export type DiningTable = {
  id: string;
  dining_hall_id?: string;
  branch_id?: string;
  name?: string;
  number?: string | null;
  capacity?: number;
  status?: 'available' | 'occupied' | 'reserved' | 'closed' | string;
  current_order_id?: string | null;
};

export type CartLineSelectedOption = {
  product_option_group_id: number;
  group_title: string;
  pricing_type: 'free' | 'per_option' | 'group_price';
  group_price?: number;
  options: {
    product_option_id: number;
    name: string;
    option_price: number;
    applied_price: number;
  }[];
};

export type ExpenseCategory = {
  id: number;
  name: string;
  description?: string | null;
  is_active?: boolean;
};

export type Promotion = {
  id: number;
  name: string;
  branch_id?: string | null;
  type: 'bogo' | 'percentage_discount' | 'fixed_discount';
  reward_value: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  priority?: number;
  conditions?: {
    condition_type: string;
    condition_value: Record<string, unknown>;
  }[];
};

export type GiftCard = {
  id: string;
  code: string;
  initial_balance: number;
  remaining_balance: number;
  status?: string;
  customer_id?: number | null;
  expires_at?: string | null;
};

export type Delivery = {
  id: string;
  status: string;
  order?: Record<string, unknown>;
  driver?: { id: string; name: string } | null;
  delivery_fee?: number;
  delivery_address?: string;
  customer?: Customer | null;
  created_at?: string;
};

export type WalletTransaction = {
  id: string;
  type: 'deposit' | 'withdraw' | 'payment' | 'refund';
  amount: number;
  balance_after?: number;
  description?: string | null;
  created_at?: string;
};

export type McpUser = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  active?: boolean;
  roles?: string[];
  created_at?: string;
};

export type McpRole = {
  id: number;
  name: string;
  guard_name?: string;
  permissions?: string[];
};
