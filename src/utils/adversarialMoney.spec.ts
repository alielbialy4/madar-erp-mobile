/**
 * Adversarial fixture checks for money / channel / discount stacking.
 * Does NOT assert live backend ledgers — certification must still do that separately.
 */
import assert from 'node:assert/strict';
import { computePosCheckoutTotals } from './posTotals';
import { applySalesChannelBasePrice, channelUnitPriceFromProduct } from './salesChannelPricing';
import type { Product } from '@/types/api';

// Exact minor-unit rounding: 10% of 33.33 must not drift.
const channelRounded = applySalesChannelBasePrice(33.33, { markup_percent: 10, rounding_increment: 0.05, rounding_mode: 'nearest' }, false);
assert.equal(channelRounded, 36.65);

const exact = applySalesChannelBasePrice(10, { exact_price: 12.34, markup_percent: 999 }, true);
assert.equal(exact, 12.34);

const product = {
  id: 1,
  name: 'A',
  selling_price: 100,
  sales_channel_pricing: {
    talabat: { markup_percent: 15, rounding_increment: 1, rounding_mode: 'up', token: 'tok' },
  },
} as Product;
assert.equal(channelUnitPriceFromProduct(product, 'talabat'), 115);
assert.equal(channelUnitPriceFromProduct(product, null), 100);

// Promotion + coupon + manual must not go negative; wrong order type yields 0 promo.
const promo = {
  id: 'p1',
  name: '10%',
  type: 'percentage_discount',
  reward_value: 10,
  priority: 1,
  config: { schema_version: 2, scope_type: 'all', order_types: ['takeaway'], stackable: false },
};
const good = computePosCheckoutTotals({
  lines: [{ product_id: 1, product_name: 'A', quantity: 1, unit_price: 100, discount: 0 }],
  products: [product],
  promotions: [promo],
  settings: { tax_enabled: false },
  branchId: '1',
  orderType: 'takeaway',
  manualDiscount: 5,
  couponDiscount: 3,
  salesChannelId: 'talabat',
});
assert.equal(good.promotionDiscount, 10);
assert.ok(good.total >= 0);
assert.equal(good.manualDiscount, 5);
assert.equal(good.couponDiscount, 3);

const blockedPromo = computePosCheckoutTotals({
  lines: [{ product_id: 1, product_name: 'A', quantity: 1, unit_price: 100, discount: 0 }],
  products: [product],
  promotions: [promo],
  settings: { tax_enabled: false },
  branchId: '1',
  orderType: 'delivery',
  salesChannelId: 'talabat',
});
assert.equal(blockedPromo.promotionDiscount, 0);

// Over-discount clamps.
const over = computePosCheckoutTotals({
  lines: [{ product_id: 1, product_name: 'A', quantity: 1, unit_price: 20, discount: 0 }],
  products: [product],
  settings: { tax_enabled: false },
  branchId: '1',
  orderType: 'takeaway',
  manualDiscount: 999,
  couponDiscount: 999,
});
assert.equal(over.total, 0);
assert.ok(over.manualDiscount <= 20);

console.log('adversarialMoney.spec.ts: OK');
