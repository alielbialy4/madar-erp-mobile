import assert from 'node:assert/strict';
import { applySalesChannelBasePrice, channelUnitPriceFromProduct, channelPriceToken } from './salesChannelPricing';
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
    ch1: { price: 12, contract: 'sales_channel_price_v1', markup_percent: 20, rounding_increment: 0, token: 't1' },
  },
};
assert.equal(channelUnitPriceFromProduct(product, 'ch1'), 12);
assert.equal(channelPriceToken(product, 'ch1'), 't1');
assert.equal(channelUnitPriceFromProduct(product, null), 10);

// V1 backend: channel product base is attested first; variant is added afterward.
const withVariant = {
  ...product,
  variants: [{ id: 'v1', additional_price: 3 }],
  units: [
    { id: 11, is_base: true, factor_to_base: 2 },
    { id: 12, is_base: false, factor_to_base: 6 },
  ],
} as Product;
assert.equal(channelUnitPriceFromProduct(withVariant, 'ch1', 'v1'), 15);
assert.equal(channelUnitPriceFromProduct(withVariant, 'ch1', 'v1', 12), 45);
assert.equal(channelUnitPriceFromProduct(withVariant, null, 'v1', 12), 39);
assert.throws(() => channelUnitPriceFromProduct(withVariant, 'ch1', 'missing'), /variant is missing/);
assert.throws(() => channelUnitPriceFromProduct(withVariant, 'ch1', null, 999), /invalid catalog conversion/);
assert.throws(() => channelUnitPriceFromProduct({ ...product, sales_channel_pricing: {} }, 'ch1'), /signed channel price quote/);
assert.throws(() => channelUnitPriceFromProduct({
  ...product, sales_channel_pricing: { ch1: { markup_percent: 20, token: 't1' } },
}, 'ch1'), /signed channel price quote/);
assert.throws(() => channelUnitPriceFromProduct({
  ...product, sales_channel_pricing: { ch1: { price: 12, token: 't1', contract: 'sales_channel_price_v2' } },
}, 'ch1'), /signed channel price quote/);
assert.equal(channelPriceToken({
  ...product, sales_channel_pricing: { ch1: { price: 12, token: 't1', contract: 'sales_channel_price_v2' } },
}, 'ch1'), undefined);
assert.throws(() => channelUnitPriceFromProduct({
  ...product, sales_channel_pricing: { ch1: { price: 12, token: 't1' } },
}, 'ch1'), /signed channel price quote/);

console.log('salesChannelPricing.spec.ts: OK');
