import type { Branch, FinancialAccount } from '@/types/api';

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'partially_paid' | 'paid' | 'cancelled' | string;

export type ExpenseCategory = {
  id: number;
  name: string;
  description?: string | null;
  branch_id?: string | null;
  branch?: Branch | null;
  is_active?: boolean;
  is_labor?: boolean;
  system_key?: string | null;
};

export type ExpensePaymentLine = {
  id: string;
  expense_id?: number;
  branch_id?: string | null;
  financial_account_id?: string | null;
  financial_account?: FinancialAccount | null;
  financialAccount?: FinancialAccount | null;
  vault?: { id: string; name?: string | null } | null;
  amount: number | string;
  paid_at?: string | null;
  reference?: string | null;
  status?: 'posted' | 'reversed' | string | null;
  reversed_at?: string | null;
  reversal_reason?: string | null;
  payer?: { id: number; name?: string | null } | null;
};

export type Expense = {
  id: number;
  client_uuid?: string | null;
  expense_category_id?: number;
  category_id?: number;
  category?: ExpenseCategory | null;
  branch_id?: string | null;
  branch?: Branch | null;
  shift_id?: string | null;
  shift?: { id: string; shift_no?: number | null; opened_at?: string | null } | null;
  user?: { id: number; name?: string | null } | null;
  updatedBy?: { id: number; name?: string | null } | null;
  status?: ExpenseStatus;
  cash_source?: 'drawer' | 'vault' | string | null;
  amount: number | string;
  description?: string | null;
  expense_date?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  payment_lines?: ExpensePaymentLine[];
  paymentLines?: ExpensePaymentLine[];
};

export type ExpenseListPayload = {
  expenses: Expense[];
  summary?: { total?: number | string; count?: number };
  pagination?: {
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
};

export type ExpensePaymentInput = {
  financial_account_id: string;
  amount: number | string;
  paid_at: string;
  reference?: string;
  idempotency_key: string;
};

export type ExpenseCreateInput = {
  client_uuid: string;
  expense_category_id: number;
  branch_id?: string;
  cash_source: 'drawer' | 'vault';
  status: 'pending' | 'paid';
  amount: number | string;
  description?: string;
  expense_date: string;
  reference_number?: string;
  notes?: string;
  payment_lines?: ExpensePaymentInput[];
};

export type RecurringExpense = {
  id: string;
  branch_id: string;
  branch?: Branch | null;
  financial_account_id?: string | null;
  financialAccount?: FinancialAccount | null;
  financial_account?: FinancialAccount | null;
  expense_category_id: number;
  category?: ExpenseCategory | null;
  title: string;
  description?: string | null;
  amount: number | string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | string;
  start_date?: string | null;
  end_date?: string | null;
  next_date?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

export type RecurringExpensePage = {
  data: RecurringExpense[];
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
};
