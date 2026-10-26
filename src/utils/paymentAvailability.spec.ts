import assert from 'node:assert/strict';
import type { Customer, FinancialAccount } from '@/types/api';
import { resolvePosCashTarget } from './paymentAccounts';
import { selectMobilePaymentMethods } from './paymentAvailability';

const accounts: FinancialAccount[] = [
  { id: 'cash-1', name: 'Drawer', payment_method: 'cash', legacy_vault_id: 'vault-1', is_active: true, allow_sales: true },
  { id: 'card-1', name: 'Card', payment_method: 'card', account_type: 'card_terminal', is_active: true, allow_sales: true },
  { id: 'insta-1', name: 'InstaPay', payment_method: 'instapay', is_active: true, allow_sales: true },
  { id: 'wallet-1', name: 'E-wallet', payment_method: 'electronic_wallet', is_active: true, allow_sales: true },
];
const cashTarget = resolvePosCashTarget({ shiftVaultId: 'vault-1' });
const customer = { id: 7, debt: 0, credit_limit: 100 } as Customer;
const select = (overrides: Partial<Parameters<typeof selectMobilePaymentMethods>[0]> = {}) => selectMobilePaymentMethods({
  branchId: 'branch-1',
  financialAccounts: accounts,
  cashTarget,
  hasOpenShift: true,
  hasActiveRegisterSession: false,
  selectedCustomer: null,
  walletBalance: null,
  amountDue: 25,
  online: true,
  ...overrides,
});

assert.deepEqual(select({ branchSettings: { pos_accepted_payment_methods: {
  cash: true, card: true, electronic_wallet: false, instapay: true, bank_transfer: false,
  payment_gateway: false, wallet: false, credit: false, layaway: false,
} } }).availableMethods, ['cash', 'card', 'instapay', 'split', 'gift_card']);
assert.deepEqual(select({ online: false }).availableMethods, ['cash']);
assert.deepEqual(select({ hasOpenShift: false }).availableMethods, ['card', 'electronic_wallet', 'instapay', 'split']);

const customerContext = select({
  selectedCustomer: customer,
  walletBalance: 30,
  branchSettings: { pos_accepted_payment_methods: {
    cash: true, card: false, electronic_wallet: true, instapay: false, bank_transfer: false,
    payment_gateway: false, wallet: true, credit: true, layaway: true,
  } },
});
assert.ok(customerContext.availableMethods.includes('wallet'));
assert.ok(customerContext.availableMethods.includes('credit'));
assert.ok(customerContext.availableMethods.includes('layaway'));
assert.ok(customerContext.availableMethods.includes('electronic_wallet'));
assert.equal(customerContext.availableMethods.includes('split'), true);

assert.equal(select({ selectedCustomer: customer, walletBalance: 10 }).availableMethods.includes('wallet'), false);
assert.equal(select({ selectedCustomer: customer, branchSettings: { pos_accepted_payment_methods: {
  cash: true, card: false, electronic_wallet: false, instapay: false, bank_transfer: false,
  payment_gateway: false, wallet: false, credit: true, layaway: false,
} } }).availableMethods.includes('credit'), true);

console.log('paymentAvailability.spec.ts: OK');
