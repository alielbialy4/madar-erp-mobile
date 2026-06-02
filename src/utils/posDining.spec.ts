/**
 * Run: npx tsx src/utils/posDining.spec.ts
 */
import assert from 'node:assert/strict';
import { cartContextFromSale, saleMetaFromServer } from './posDining';

const sale = {
  id: 42,
  updated_at: '2026-06-02T12:00:00Z',
  print_sequence: 7,
  invoice_number: 'INV-1',
  items: [{ product_id: 1, quantity: 2, unit_price: 5, product: { name: 'X' } }],
  discount: 10,
  promotion_discount: 2,
  coupon_discount: 3,
  coupon_id: 'c1',
};

const meta = saleMetaFromServer(sale);
assert.equal(meta.activeOrderId, 42);
assert.equal(meta.saleUpdatedAt, '2026-06-02T12:00:00Z');

const ctx = cartContextFromSale(sale);
assert.equal(ctx.lines.length, 1);
assert.equal(ctx.cartDiscount, 5);
assert.ok(ctx.appliedCoupon);

console.log('posDining.spec.ts: OK');
