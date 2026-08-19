/**
 * Run: npx tsx src/utils/branchShiftCloseVisibility.spec.ts
 */
import assert from 'node:assert/strict';
import { cashierMayCloseBranchShift } from './branchShiftCloseVisibility';

assert.equal(
  cashierMayCloseBranchShift({
    isCashier: true,
    registerMode: 'multi_register',
    canManageShifts: false,
  }),
  false,
);

assert.equal(
  cashierMayCloseBranchShift({
    isCashier: true,
    registerMode: 'legacy_shared_drawer',
    canManageShifts: false,
  }),
  true,
);

assert.equal(
  cashierMayCloseBranchShift({
    isCashier: true,
    registerMode: 'multi_register',
    canManageShifts: true,
  }),
  true,
);

assert.equal(
  cashierMayCloseBranchShift({
    isCashier: false,
    registerMode: 'multi_register',
    canManageShifts: false,
  }),
  true,
);

console.log('branchShiftCloseVisibility.spec.ts: OK');
