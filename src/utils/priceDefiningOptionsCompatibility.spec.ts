import assert from 'node:assert/strict';
import type { CartLine } from '@/utils/cartLine';
import { priceDefiningOptionsCapabilityError } from './priceDefiningOptionsCompatibility';

const line: CartLine = {
  product_id: 1,
  product_name: 'Burger',
  quantity: 1,
  unit_price: 5,
  discount: 0,
  selected_options: [{
    product_option_group_id: 1,
    group_title: 'Size',
    pricing_type: 'per_option',
    price_behavior: 'defines_base_price',
    options: [{ product_option_id: 1, name: 'Large', option_price: 150, applied_price: 0 }],
  }],
};

assert.equal(priceDefiningOptionsCapabilityError([line], 1), null);
assert.match(priceDefiningOptionsCapabilityError([line], null) ?? '', /كتالوج نقطة البيع قديم/);
assert.match(priceDefiningOptionsCapabilityError([line], 0) ?? '', /كتالوج نقطة البيع قديم/);
assert.equal(priceDefiningOptionsCapabilityError([{ ...line, selected_options: undefined }], null), null);

console.log('priceDefiningOptionsCompatibility.spec.ts: OK');
