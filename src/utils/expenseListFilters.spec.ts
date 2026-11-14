/**
 * Expense list filters must stamp vault/shift/user like web Expenses list.
 */
import assert from 'node:assert/strict';
import {
  EMPTY_EXPENSE_FILTERS,
  buildExpenseListParams,
} from './expenseListFilters';

const base = { ...EMPTY_EXPENSE_FILTERS };

{
  const params = buildExpenseListParams({
    search: ' rent ',
    filters: {
      ...base,
      expense_category_id: '9',
      status: 'partially_paid',
      cash_source: 'drawer',
      vault_id: 'v1',
      shift_id: 's1',
      user_id: '42',
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      min_amount: '10',
      max_amount: '500',
      branch_id: 'b-global',
    },
    globalView: true,
    activeBranchId: 'ignored',
  });
  assert.equal(params.search, 'rent');
  assert.equal(params.expense_category_id, '9');
  assert.equal(params.status, 'partially_paid');
  assert.equal(params.cash_source, 'drawer');
  assert.equal(params.vault_id, 'v1');
  assert.equal(params.shift_id, 's1');
  assert.equal(params.user_id, '42');
  assert.equal(params.branch_id, 'b-global');
  assert.equal(params.sort_by, 'expense_date');
}

{
  const params = buildExpenseListParams({
    filters: { ...base },
    globalView: false,
    activeBranchId: 'branch-a',
  });
  assert.equal(params.branch_id, 'branch-a');
  assert.equal(params.vault_id, undefined);
  assert.equal(params.branch_id, 'branch-a');
}

console.log('expenseListFilters.spec.ts: OK');
