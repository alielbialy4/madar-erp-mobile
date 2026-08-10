import assert from 'node:assert/strict';
import { expensePaymentTotals, validateExpenseSplit } from './expenseFinancials';

assert.deepEqual(
  expensePaymentTotals({
    amount: '100.00',
    payment_lines: [
      { id: 'one', amount: '35.00', status: 'posted' },
      { id: 'two', amount: '15.00', status: 'reversed' },
      { id: 'three', amount: 10, status: 'posted' },
    ],
  }),
  { total: 100, paid: 45, remaining: 55 },
);

assert.deepEqual(
  validateExpenseSplit(100, 'account-a', [{ financial_account_id: 'account-b', amount: 35 }]),
  { ok: true, primaryAmount: 65, total: 100 },
);

assert.equal(validateExpenseSplit(100, 'account-a', [{ financial_account_id: 'account-a', amount: 20 }]).ok, false);
assert.equal(validateExpenseSplit(100, 'account-a', [{ financial_account_id: 'account-b', amount: 100 }]).ok, false);
assert.equal(validateExpenseSplit(0, 'account-a', []).ok, false);

console.log('expenseFinancials.spec passed');

