import assert from 'node:assert/strict';
import { normalizeExpiryStockParams } from './normalizeInventoryQuery';

assert.deepEqual(normalizeExpiryStockParams({ per_page: 6, near_expiry_only: true }), {
  per_page: 6,
  near_expiry_only: 1,
});
assert.deepEqual(normalizeExpiryStockParams({ expired_only: false, search: 'milk' }), {
  expired_only: 0,
  search: 'milk',
});
assert.equal(normalizeExpiryStockParams(undefined), undefined);

console.log('normalizeInventoryQuery.spec.ts: OK');
