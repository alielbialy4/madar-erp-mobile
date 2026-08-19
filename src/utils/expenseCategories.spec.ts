import assert from 'node:assert/strict';
import { isManualExpenseCategory, isSystemPayrollCategory } from './expenseCategories';

assert.equal(isSystemPayrollCategory({ system_key: 'system_payroll', is_active: true }), true);
assert.equal(isManualExpenseCategory({ system_key: 'system_payroll', is_active: true }), false);
assert.equal(isManualExpenseCategory({ system_key: null, is_active: true }), true);
assert.equal(isManualExpenseCategory({ is_active: true }), true);
