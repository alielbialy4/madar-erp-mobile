/**
 * Run: npx tsx src/utils/posDining.spec.ts
 */
import assert from 'node:assert/strict';
import { buildTableOrderDraftPayload, cartContextFromSale, saleMetaFromServer } from './posDining';
import { cartLineGross } from './cartPricing';

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

const draft = buildTableOrderDraftPayload({
  cart: ctx.lines,
  table: { id: 'table-1' },
  subtotal: 10,
  tax: 0,
  invoiceDiscount: 0,
  promotionDiscount: 0,
  couponDiscount: 0,
  serviceCharge: 1,
  total: 11,
});
assert.equal(draft.service_charge, 1);
assert.equal(draft.total, 11);

const optionSale = {
  items: [{
    product_id: 3,
    quantity: 1,
    unit_price: 170,
    product: { name: 'Burger' },
    options: [
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
};
const restoredLine = cartContextFromSale(optionSale).lines[0];
assert.equal(restoredLine.unit_price, 150);
assert.equal(cartLineGross(restoredLine), 170);
assert.equal(restoredLine.selected_options?.[0].options[0].option_price, 0);

console.log('posDining.spec.ts: OK');
