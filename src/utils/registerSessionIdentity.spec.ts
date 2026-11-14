import assert from 'node:assert/strict';
import {
  canResumeRegisterSession,
  isRegisterOccupiedByAnotherCashier,
} from './registerSessionIdentity';

assert.equal(canResumeRegisterSession(null, 1), false);
assert.equal(canResumeRegisterSession({ cashier: { id: 1 } }, 1), true);
assert.equal(canResumeRegisterSession({ cashier: { id: 2 } }, 1), false);
assert.equal(isRegisterOccupiedByAnotherCashier({ cashier: { id: 2 } }, 1), true);
assert.equal(isRegisterOccupiedByAnotherCashier({ cashier: { id: 1 } }, 1), false);
assert.equal(isRegisterOccupiedByAnotherCashier(null, 1), false);

console.log('registerSessionIdentity.spec.ts: OK');
