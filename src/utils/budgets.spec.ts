import assert from 'node:assert/strict';
import { budgetGridToLines, budgetGridTotal, linesToBudgetGrid } from './budgets';

const grid = linesToBudgetGrid([
  { section: 'revenue', expense_category_id: null, sort_order: 10, month: 1, amount: '12.5' },
  { section: 'revenue', expense_category_id: null, sort_order: 10, month: 2, amount: 7.5 },
  { section: 'opex', expense_category_id: 4, expense_category: { id: 4, name: 'إيجار' }, sort_order: 20, month: 1, amount: 3 },
]);

assert.equal(grid.length, 2);
assert.equal(grid[0].amounts[1], 12.5);
assert.equal(grid[0].amounts[2], 7.5);
assert.equal(budgetGridTotal(grid, 'revenue'), 20);
assert.equal(budgetGridToLines(grid).length, 24);
assert.equal(budgetGridToLines(grid).find((line) => line.section === 'opex' && line.month === 1)?.amount, 3);
