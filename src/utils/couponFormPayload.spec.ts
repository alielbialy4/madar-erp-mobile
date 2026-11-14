import assert from 'node:assert/strict';
import { buildCouponFormPayload } from './couponFormPayload';

function run() {
  const payload = buildCouponFormPayload({
    code: '  save10 ',
    name: ' Save 10 ',
    description: 'desc',
    type: 'percentage',
    value: '10',
    minOrder: '100',
    maxDiscount: '50',
    maxUses: '20',
    maxUsesPerCustomer: '2',
    startsAt: '2026-01-01',
    expiresAt: '2026-12-31',
    branchId: 'b1',
    isActive: true,
  });

  assert.deepEqual(payload, {
    code: 'SAVE10',
    name: 'Save 10',
    description: 'desc',
    type: 'percentage',
    value: 10,
    min_order_amount: 100,
    max_discount_amount: 50,
    max_uses: 20,
    max_uses_per_customer: 2,
    starts_at: '2026-01-01T00:00:00',
    expires_at: '2026-12-31T23:59:59',
    is_active: true,
    branch_id: 'b1',
  });

  const empty = buildCouponFormPayload({
    code: 'x',
    name: 'y',
    description: '  ',
    type: 'fixed',
    value: 'bad',
    minOrder: '',
    maxDiscount: '',
    maxUses: '',
    maxUsesPerCustomer: '',
    startsAt: '',
    expiresAt: '',
    branchId: '',
    isActive: false,
  });
  assert.equal(empty.description, null);
  assert.equal(empty.value, 0);
  assert.equal(empty.min_order_amount, null);
  assert.equal(empty.max_uses, null);
  assert.equal(empty.starts_at, null);
  assert.equal(empty.branch_id, null);
  assert.equal(empty.is_active, false);

  console.log('couponFormPayload.spec.ts: ok');
}

run();
