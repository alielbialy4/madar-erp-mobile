import type { ListParams } from '@/types/api';

export type ExpenseListFilters = {
  expense_category_id: string;
  branch_id: string;
  from_date: string;
  to_date: string;
  status: string;
  cash_source: string;
  vault_id: string;
  shift_id: string;
  user_id: string;
  min_amount: string;
  max_amount: string;
};

export const EMPTY_EXPENSE_FILTERS: ExpenseListFilters = {
  expense_category_id: '',
  branch_id: '',
  from_date: '',
  to_date: '',
  status: '',
  cash_source: '',
  vault_id: '',
  shift_id: '',
  user_id: '',
  min_amount: '',
  max_amount: '',
};

export function countExpenseFilters(filters: ExpenseListFilters): number {
  return Object.values(filters).filter((value) => value !== '').length;
}

/** Build GET /expenses query params to match web Expenses list filters. */
export function buildExpenseListParams(input: {
  search?: string;
  filters: ExpenseListFilters;
  globalView: boolean;
  activeBranchId?: string | null;
}): ListParams {
  const { search, filters, globalView, activeBranchId } = input;
  const params: ListParams = {
    sort_by: 'expense_date',
    sort_dir: 'desc',
  };
  const trimmed = search?.trim();
  if (trimmed) params.search = trimmed;
  if (filters.expense_category_id) params.expense_category_id = filters.expense_category_id;
  if (filters.status) params.status = filters.status;
  if (filters.cash_source) params.cash_source = filters.cash_source;
  if (filters.vault_id) params.vault_id = filters.vault_id;
  if (filters.shift_id) params.shift_id = filters.shift_id;
  if (filters.user_id) params.user_id = filters.user_id;
  if (filters.from_date) params.from_date = filters.from_date;
  if (filters.to_date) params.to_date = filters.to_date;
  if (filters.min_amount) params.min_amount = filters.min_amount;
  if (filters.max_amount) params.max_amount = filters.max_amount;
  if (globalView && filters.branch_id) params.branch_id = filters.branch_id;
  else if (!globalView && activeBranchId) params.branch_id = activeBranchId;
  return params;
}
