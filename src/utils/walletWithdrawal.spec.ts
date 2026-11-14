import assert from 'node:assert/strict';
import { canWithdrawWalletAmount, parsePositiveAmount } from './walletWithdrawal';

assert.equal(parsePositiveAmount('10'), 10);
assert.equal(parsePositiveAmount('0'), null);
assert.equal(parsePositiveAmount('-1'), null);
assert.equal(canWithdrawWalletAmount('5', 10), true);
assert.equal(canWithdrawWalletAmount('10', 10), true);
assert.equal(canWithdrawWalletAmount('10.01', 10), false);
assert.equal(canWithdrawWalletAmount('abc', 10), false);

console.log('walletWithdrawal.spec.ts: OK');
