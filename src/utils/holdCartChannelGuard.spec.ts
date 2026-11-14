import assert from 'node:assert/strict';
import {
  HOLD_CART_REQUIRES_DIRECT_MESSAGE_AR,
  holdCartBlockedBySalesChannel,
} from './holdCartChannelGuard';

assert.equal(holdCartBlockedBySalesChannel(null), false);
assert.equal(holdCartBlockedBySalesChannel(undefined), false);
assert.equal(holdCartBlockedBySalesChannel(''), false);
assert.equal(holdCartBlockedBySalesChannel('   '), false);
assert.equal(holdCartBlockedBySalesChannel('talabat'), true);
assert.ok(HOLD_CART_REQUIRES_DIRECT_MESSAGE_AR.includes('مباشر'));

console.log('holdCartChannelGuard.spec.ts: OK');
