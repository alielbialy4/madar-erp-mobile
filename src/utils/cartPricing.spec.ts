/**
 * Run: npx tsx src/utils/cartPricing.spec.ts
 */
import assert from 'node:assert/strict';
import type { CartLine } from '@/utils/cartLine';
import { cartLineGross, computeOptionsPrice, lineUnitPriceWithOptions } from './cartPricing';
import { effectiveCatalogUnitPrice, isProductPromotional } from './productPromotions';
import { unitSellingPrice } from './posUnitPrice';
import type { Product } from '@/types/api';

const line: CartLine = {
  product_id: 1,
  product_name: 'Test',
  quantity: 2,
  unit_price: 10,
  discount: 1,
  selected_options: [
    {
      product_option_group_id: 1,
      group_title: 'Extras',
      pricing_type: 'per_option',
      options: [{ product_option_id: 1, name: 'Cheese', option_price: 3 }],
    },
    {
      product_option_group_id: 2,
      group_title: 'Size',
      pricing_type: 'group_price',
      group_price: 5,
      options: [{ product_option_id: 2, name: 'Large', option_price: 0 }],
    },
  ],
};

assert.equal(computeOptionsPrice(line.selected_options), 8);
assert.equal(lineUnitPriceWithOptions(line), 18);
assert.equal(cartLineGross(line), 35);

const plainLine: CartLine = {
  product_id: 2,
  product_name: 'Plain',
  quantity: 3,
  unit_price: 20,
  discount: 0,
};
assert.equal(cartLineGross(plainLine), 60);

const promoProduct = {
  selling_price: 100,
  is_promotional: true,
  promotional_price: 75,
  promotional_start_date: '2020-01-01',
  promotional_end_date: '2099-12-31',
} as Product;

assert.equal(isProductPromotional(promoProduct), true);
assert.equal(effectiveCatalogUnitPrice(promoProduct), 75);
assert.equal(unitSellingPrice(promoProduct), 75);

console.log('cartPricing.spec.ts: OK');
