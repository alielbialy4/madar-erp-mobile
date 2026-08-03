import type { Branch, Vault } from '@/types/api';

export type ShiftFilterUser = { id: number; name: string };

export type ShiftListRow = {
  id: string;
  shift_no?: number | null;
  user_id: number;
  branch_id: string;
  vault_id: string;
  user?: { id: number; name: string } | null;
  branch?: { id: string; name: string; code?: string } | null;
  vault?: { id: string; name: string; is_active?: boolean; balance?: string } | null;
  opened_at: string;
  closed_at?: string | null;
  starting_cash: string;
  status: string;
  notes?: string | null;
  drawer_balance?: string | null;
};

export type CurrentMeta = {
  has_open_shift: boolean;
  reason: string | null;
  shift_owner_id: number | null;
  shift_owner_name: string | null;
  opened_by_id: number | null;
  opened_by_name: string | null;
  is_shift_owner: boolean;
  can_close_shift: boolean;
};

export type ShiftCloseBlocker = {
  code: string;
  message: string;
};

export type ClosePreview = {
  starting_cash: string;
  expected_cash: string;
  expected_is_negative?: boolean;
  requires_close_reason?: boolean;
  allowed_settlement_directions?: Array<'deposit' | 'withdraw'>;
  default_settlement_direction?: 'deposit' | 'withdraw';
  cash_difference?: string | null;
  counted_cash?: string;
  close_blockers?: ShiftCloseBlocker[];
  can_close?: boolean;
  card_payments?: string;
  instapay_payments?: string;
  electronic_wallet_payments?: string;
  wallet_payments?: string;
  credit_payments?: string;
  layaway_payments?: string;
  debt_collections?: string;
  layaway_collections?: string;
};

export type ShiftDetailedSummary = {
  close_blockers?: ShiftCloseBlocker[];
  can_close?: boolean;
  shift: {
    id: string;
    shift_no: number | null;
    branch: { id: string; name: string; code?: string } | null;
    cashier: { id: number; name: string } | null;
    vault: { id: string; name: string } | null;
    opened_at: string | null;
    closed_at: string | null;
    status: string;
    starting_cash: string;
  };
  totals: {
    invoice_count: number;
    gross_sales: string;
    total_paid: string;
    /** Canonical operational refund total */
    shift_total_refunds?: string;
    /** @deprecated alias of shift_total_refunds */
    total_refunds: string;
    refund_count: number;
    /** Canonical net sales activity */
    shift_net_sales_activity?: string;
    /** @deprecated alias of shift_net_sales_activity */
    net_revenue: string;
    total_expenses: string;
    cash_sales: string;
    non_cash_sales: string;
    card_payments?: string;
    instapay_payments?: string;
    electronic_wallet_payments?: string;
    wallet_payments?: string;
    credit_payments?: string;
    layaway_payments?: string;
    debt_collections?: string;
    layaway_collections?: string;
    allocated_cash_refunds?: string;
    /** @deprecated alias of allocated_cash_refunds */
    cash_method_refunds?: string;
    non_cash_refunds?: string;
    unallocated_refunds?: string;
    /** Canonical drawer cash refund OUTs */
    drawer_cash_refund_outflows?: string;
    /** @deprecated alias of drawer_cash_refund_outflows */
    cash_refunds: string;
    cash_deposits: string;
    cash_withdrawals: string;
    cash_expenses: string;
    expected_cash: string;
    actual_cash: string | null;
    variance: string | null;
    deposit_amount?: string | null;
    deposit_vault_id?: string | null;
    closing_vault_settlement_direction?: 'deposit' | 'withdraw' | null;
  };
  invoices: Array<{
    id: number;
    invoice_number: string | null;
    print_sequence: number | null;
    created_at: string;
    customer_name: string | null;
    payment_type: string;
    total: string;
    paid: string;
    refund_amount: string;
    net_amount: string;
    status: string;
    cashier_name: string | null;
  }>;
  sold_products: Array<{
    product_id: number;
    product_name: string;
    category_name: string | null;
    quantity_sold: number;
    gross_amount: string;
    refunded_quantity: number;
    net_quantity: number;
    net_amount: string;
  }>;
  refunds: Array<{
    id: number;
    sale_id: number;
    invoice_number: string | null;
    amount: string;
    reason: string | null;
    created_at: string;
    cashier_name: string | null;
    payment_type: string | null;
  }>;
  expenses: Array<{
    id: number;
    category_name: string | null;
    note: string | null;
    amount: string;
    created_at: string;
    created_by_name: string | null;
    vault_name: string | null;
  }>;
  cash_movements: Array<{
    id: number | string;
    type: string;
    direction: 'in' | 'out';
    amount: string;
    note: string | null;
    created_at: string;
  }>;
};

export type ActiveShiftExtended = {
  id: string;
  shift_no?: number | null;
  user_id?: number;
  opened_by?: number | null;
  branch_id: string;
  vault_id: string;
  vault?: Vault | null;
  branch?: Branch | null;
  opened_at?: string;
  closed_at?: string | null;
  starting_cash?: string | number;
  expected_cash?: string | number | null;
  actual_cash?: string | number | null;
  drawer_ledger_enabled?: boolean;
  accounting_model?: 'shift_drawer_ledger' | 'legacy_vault_shift';
  status?: string;
  notes?: string | null;
};
