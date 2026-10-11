/**
 * Run: npx tsx src/services/printing/receiptMappers.spec.ts
 */
import assert from 'node:assert/strict';
import { mapCheckoutToReceiptPayload } from './receiptMappers';

const payload = mapCheckoutToReceiptPayload({
  cartLines: [{
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
  }],
  products: [],
  catalogSettings: {},
  subtotal: 170,
  discount: 0,
  tax: 0,
  total: 170,
  paid: 170,
  paymentType: 'cash',
});

assert.equal(payload.items[0].unit_price, 170);
assert.equal(payload.items[0].line_total, 170);
assert.equal(payload.items[0].options?.[0].options[0].applied_price, 0);

console.log('receiptMappers.spec.ts: OK');
