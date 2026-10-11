/**
 * Run: npx tsx src/utils/cartPricing.spec.ts
 */
import assert from 'node:assert/strict';
import type { CartLine } from '@/utils/cartLine';
import { cartLineGross, computeOptionsPrice, lineUnitPriceWithOptions, unitPriceWithOptions } from './cartPricing';
import { effectiveCatalogUnitPrice, isProductPromotional } from './productPromotions';
import { priceDefiningOptionUnitPrice, unitSellingPrice } from './posUnitPrice';
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

const sizePriceLine: CartLine = {
  product_id: 3,
  product_name: 'Burger',
  quantity: 1,
  unit_price: 0,
  discount: 0,
  selected_options: [
    {
      product_option_group_id: 3,
      group_title: 'Size',
      pricing_type: 'per_option',
      price_behavior: 'defines_base_price',
      options: [{ product_option_id: 31, name: 'Large', option_price: 150, applied_price: 0 }],
    },
    {
      product_option_group_id: 4,
      group_title: 'Extras',
      pricing_type: 'per_option',
      price_behavior: 'additive',
      options: [{ product_option_id: 41, name: 'Cheese', option_price: 20, applied_price: 20 }],
    },
  ],
};
assert.equal(computeOptionsPrice(sizePriceLine.selected_options), 20);
assert.equal(lineUnitPriceWithOptions(sizePriceLine), 170);
assert.equal(cartLineGross({ ...sizePriceLine, discount: 17 }), 153);

const variantBurger = {
  selling_price: 0,
  variants: [{ id: 'premium', name: 'Premium', additional_price: 5 }],
} as Product;
const selectedLarge = [
  {
    product_option_group_id: 8,
    group_title: 'Size',
    pricing_type: 'per_option' as const,
    price_behavior: 'defines_base_price' as const,
    options: [{ product_option_id: 81, name: 'Large', option_price: 150, applied_price: 0 }],
  },
];
assert.equal(unitPriceWithOptions(unitSellingPrice(variantBurger), selectedLarge), 150);
assert.equal(unitPriceWithOptions(unitSellingPrice(variantBurger, 'premium'), selectedLarge), 155);
const variantLargeLine: CartLine = {
  product_id: 8,
  product_name: 'Burger',
  quantity: 1,
  unit_price: unitSellingPrice(variantBurger, 'premium'),
  discount: 0,
  variant_id: 'premium',
  selected_options: selectedLarge,
};
assert.equal(unitPriceWithOptions(variantLargeLine.unit_price, variantLargeLine.selected_options), 155);
assert.equal(lineUnitPriceWithOptions(variantLargeLine), 155);
const variantLargeWithCheese = {
  ...variantLargeLine,
  selected_options: [...selectedLarge, {
    product_option_group_id: 9,
    group_title: 'Extras',
    pricing_type: 'per_option' as const,
    price_behavior: 'additive' as const,
    options: [{ product_option_id: 91, name: 'Cheese', option_price: 20, applied_price: 20 }],
  }],
};
assert.equal(unitPriceWithOptions(variantLargeLine.unit_price, variantLargeWithCheese.selected_options), 175);
assert.equal(lineUnitPriceWithOptions(variantLargeWithCheese), 175);

const legacyZeroBaseLine: CartLine = {
  product_id: 10,
  product_name: 'Legacy zero base',
  quantity: 1,
  unit_price: 0,
  discount: 0,
  selected_options: [{
    product_option_group_id: 10,
    group_title: 'Option',
    pricing_type: 'per_option',
    price_behavior: 'additive',
    options: [{ product_option_id: 101, name: 'Option', option_price: 150, applied_price: 150 }],
  }],
};
assert.equal(lineUnitPriceWithOptions(legacyZeroBaseLine), 150);

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

const packagedPriceProduct = {
  selling_price: 0,
  units: [
    { id: 1, name: 'Each', factor_to_base: 1, is_base: true },
    { id: 2, name: 'Pack', factor_to_base: 6, is_base: false },
  ],
} as Product;
assert.equal(priceDefiningOptionUnitPrice(packagedPriceProduct, 150, 2), 900);

console.log('cartPricing.spec.ts: OK');
