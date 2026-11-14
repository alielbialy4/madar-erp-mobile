import assert from 'node:assert/strict';
import { applySalesChannelBasePrice, channelUnitPriceFromProduct } from './salesChannelPricing';
import type { Product } from '@/types/api';

assert.equal(applySalesChannelBasePrice(100, { markup_percent: 10, rounding_increment: 0 }, false), 110);
assert.equal(applySalesChannelBasePrice(100, { markup_percent: 0, exact_price: 88 }, true), 88);
assert.equal(
  applySalesChannelBasePrice(10, { markup_percent: 0, rounding_increment: 0.5, rounding_mode: 'up' }, false),
  10,
);

const product: Product = {
  id: 1,
  name: 'Tea',
  selling_price: 10,
  sales_channel_pricing: {
    ch1: { markup_percent: 20, rounding_increment: 0, token: 't1' },
  },
};
assert.equal(channelUnitPriceFromProduct(product, 'ch1'), 12);
assert.equal(channelUnitPriceFromProduct(product, null), 10);

console.log('salesChannelPricing.spec.ts: OK');
