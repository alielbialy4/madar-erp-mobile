export type BranchStatus = 'active' | 'inactive';

export type BranchManageRow = {
  id: string;
  name: string;
  code: string;
  location: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  contact_info?: { phone?: string | null; email?: string | null } | null;
  status: BranchStatus;
  is_main: boolean;
  warehouse_id?: string | null;
  vault_id?: string | null;
  default_warehouse_id?: string | null;
  default_vault_id?: string | null;
  default_warehouse?: { id: string; name: string; code?: string } | null;
  default_vault?: { id: string; name: string } | null;
  warehouse?: { id: string; name: string; code: string; status?: string } | null;
  vault?: { id: string; name: string; is_active?: boolean } | null;
  warehouses_count?: number;
  vaults_count?: number;
  users_count?: number;
  dining_halls_count?: number;
  dining_tables_count?: number;
  sections_count?: number;
  warehouses?: { id: string; name: string; code: string; status: string }[];
  vaults?: { id: string; name: string; is_active: boolean }[];
  dining_halls?: { id: string; name: string; is_active: boolean; tables?: { id: string }[] }[];
  sections?: { id: string; name: string; type: string; is_active: boolean }[];
  settings?: Record<string, unknown> | null;
};

export type BranchSummary = {
  today_sales?: number;
  today_orders?: number;
  month_sales?: number;
  inventory_value?: number;
};

export type BranchCreatePayload = {
  name: string;
  code: string;
  location?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  status?: BranchStatus;
  is_main?: boolean;
  warehouse_id?: string;
  vault_id?: string;
  warehouse_name?: string;
  vault_name?: string;
};

export type BranchUpdatePayload = Partial<BranchCreatePayload> & {
  address?: string | null;
  warehouse_id?: string;
  vault_id?: string;
};
