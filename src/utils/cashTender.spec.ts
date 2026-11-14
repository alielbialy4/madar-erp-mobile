import assert from 'node:assert/strict';
import { cashAppliedAmount, cashChangeAmount, cashShortfallAmount } from './cashTender';

assert.equal(cashAppliedAmount(100, 80), 80);
assert.equal(cashChangeAmount(100, 80), 20);
assert.equal(cashShortfallAmount(50, 80), 30);
assert.equal(cashAppliedAmount(0, 80), 0);

console.log('cashTender.spec.ts: OK');
