import { del, get, post, put } from './client';

export type BudgetStatus = 'draft' | 'active' | 'closed';
export type BudgetScope = 'company' | 'branch';
export type BudgetSection = 'revenue' | 'cogs' | 'labor' | 'opex';

export type BudgetLine = {
  id?: number;
  section: BudgetSection;
  expense_category_id: number | null;
  sort_order: number;
  month: number;
  amount: number | string;
  expense_category?: { id: number; name: string; is_labor?: boolean } | null;
};

export type Budget = {
  id: string;
  scope: BudgetScope;
  branch_id: string | null;
  year: number;
  name: string;
  status: BudgetStatus;
  notes?: string | null;
  annual_total?: number | string | null;
  branch?: { id: string; name: string } | null;
  lines?: BudgetLine[];
};

export type BudgetListParams = {
  branch_id?: string;
  scope?: BudgetScope;
  year?: number;
  status?: BudgetStatus;
  search?: string;
  per_page?: number;
  page?: number;
};

export type BudgetLinePayload = {
  section: BudgetSection;
  expense_category_id?: number | null;
  sort_order?: number;
  month: number;
  amount: number;
};

export const budgetsAPI = {
  list: (params?: BudgetListParams) => get<Budget[]>('/budgets', params),
  get: (id: string) => get<Budget>(`/budgets/${id}`),
  create: (payload: { scope?: BudgetScope; branch_id?: string | null; year: number; name: string; notes?: string | null }) =>
    post<Budget>('/budgets', payload),
  update: (id: string, payload: { name?: string; notes?: string | null }) => put<Budget>(`/budgets/${id}`, payload),
  remove: (id: string) => del(`/budgets/${id}`),
  activate: (id: string) => post<Budget>(`/budgets/${id}/activate`),
  close: (id: string) => post<Budget>(`/budgets/${id}/close`),
  updateLines: (id: string, lines: BudgetLinePayload[]) => put<Budget>(`/budgets/${id}/lines`, { lines }),
  seedFromActuals: (id: string, sourceYear: number) => post<Budget>(`/budgets/${id}/seed-from-actuals`, { source_year: sourceYear }),
  syncCategories: (id: string) => post<Budget>(`/budgets/${id}/sync-categories`),
  clone: (id: string, year: number) => post<Budget>(`/budgets/${id}/clone`, { year }),
};
