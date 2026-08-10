import assert from 'node:assert/strict';
import {
  availablePaymentAccounts,
  buildCanonicalPaymentLine,
  buildCanonicalSplitPaymentLines,
  defaultPaymentAccount,
} from './paymentAccounts';
import type { FinancialAccount } from '@/types/api';

const accounts: FinancialAccount[] = [
  { id: 'cash-1', name: 'درج الفرع', payment_method: 'cash', legacy_vault_id: 'vault-1', is_default: true },
  { id: 'card-1', name: 'جهاز البطاقة', payment_method: 'card', masked_identifier: '****1234' },
  { id: 'insta-1', name: 'Instapay الرئيسي', payment_method: 'instapay', provider_name: 'Bank', is_active: true },
];

assert.equal(availablePaymentAccounts(accounts, 'card')[0]?.id, 'card-1');
assert.equal(defaultPaymentAccount(accounts, 'cash')?.id, 'cash-1');
assert.equal(availablePaymentAccounts(accounts, 'cash', 'other-vault').length, 0);
assert.equal(defaultPaymentAccount(accounts, 'cash', 'vault-1')?.id, 'cash-1');
assert.deepEqual(buildCanonicalPaymentLine({ accounts, paymentMethod: 'card', accountId: 'card-1', amount: 25 }), {
  financial_account_id: 'card-1',
  vault_id: null,
  amount: 25,
  payment_method: 'card',
});
assert.equal(buildCanonicalPaymentLine({ accounts, paymentMethod: 'card', accountId: 'vault-1', amount: 25 }), null);
assert.equal(buildCanonicalPaymentLine({ accounts, paymentMethod: 'cash', accountId: 'cash-1', amount: 25, shiftVaultId: 'other-vault' }), null);
assert.deepEqual(buildCanonicalSplitPaymentLines([
  { payment_method: 'cash', financial_account_id: 'cash-1', amount: '10' },
  { payment_method: 'instapay', financial_account_id: 'insta-1', amount: '15' },
], accounts), [
  { financial_account_id: 'cash-1', vault_id: 'vault-1', amount: 10, payment_method: 'cash' },
  { financial_account_id: 'insta-1', amount: 15, payment_method: 'instapay' },
]);

console.log('paymentAccounts.spec.ts: OK');
