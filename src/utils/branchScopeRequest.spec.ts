import assert from 'node:assert/strict';
import { createBranchScopeRequestGuard } from './branchScopeRequest';

const guard = createBranchScopeRequestGuard();
const branchARequest = guard.begin('branch-a');
assert.equal(guard.isCurrent(branchARequest, 'branch-a'), true);

const branchBRequest = guard.begin('branch-b');
assert.equal(guard.isCurrent(branchARequest, 'branch-a'), false);
assert.equal(guard.isCurrent(branchARequest, 'branch-b'), false);
assert.equal(guard.isCurrent(branchBRequest, 'branch-b'), true);

guard.invalidate();
assert.equal(guard.isCurrent(branchBRequest, 'branch-b'), false);

console.log('branchScopeRequest.spec.ts: OK');
