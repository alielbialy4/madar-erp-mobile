/**
 * Run: npx tsx src/utils/posTotals.spec.ts
 */
import assert from 'node:assert/strict';
import type { CartLine } from '@/utils/cartLine';
import { branchTaxMode, computePosCheckoutTotals, resolvePosCatalogSettings } from './posTotals';
import type { PosCatalog, Product } from '@/types/api';

const catalog = {
  settings: { allow_pos_discount: true },
  branch: {
    settings: {
      auto_print_receipt: true,
      customer_printer_profile_id: 'cashier-tcp-1',
      enable_kitchen_print: true,
      receipt_show_branch_name: false,
      customer_receipt_font_size: 14,
    },
  },
} as unknown as PosCatalog;

const merged = resolvePosCatalogSettings(catalog);
assert.equal(merged.auto_print_receipt, true);
assert.equal(merged.customer_printer_profile_id, 'cashier-tcp-1');
assert.equal(merged.enable_kitchen_print, true);
assert.equal(merged.receipt_show_branch_name, false);
assert.equal(merged.customer_receipt_font_size, 14);
assert.equal(merged.allow_pos_discount, true);

const noBranchPrint = resolvePosCatalogSettings({
  settings: { auto_print_receipt: false },
  branch: { settings: {} },
} as unknown as PosCatalog);
assert.equal(noBranchPrint.auto_print_receipt, false);

assert.equal(branchTaxMode({}), 'fallback');
assert.equal(branchTaxMode({ tax_enabled: true }), 'enabled');
assert.equal(branchTaxMode({ tax_enabled: false }), 'disabled');

const optionLine: CartLine = {
  product_id: 1,
  product_name: 'Burger',
  quantity: 1,
  unit_price: 50,
  discount: 0,
  selected_options: [
    {
      product_option_group_id: 1,
      group_title: 'Add-on',
      pricing_type: 'per_option',
      options: [{ product_option_id: 1, name: 'Cheese', option_price: 10 }],
    },
  ],
};

const plainTotals = computePosCheckoutTotals({
  lines: [{ product_id: 2, product_name: 'Water', quantity: 2, unit_price: 5, discount: 0 }],
  products: [{ id: 2, name: 'Water', tax_rate: 0 } as Product],
  settings: {},
  branchId: '1',
  orderType: 'takeaway',
});
assert.equal(plainTotals.gross, 10);

const optionTotals = computePosCheckoutTotals({
  lines: [optionLine],
  products: [{ id: 1, name: 'Burger', tax_rate: 0 } as Product],
  settings: {},
  branchId: '1',
  orderType: 'takeaway',
});
assert.equal(optionTotals.gross, 60);
assert.equal(optionTotals.total, 60);

const fallbackTaxTotals = computePosCheckoutTotals({
  lines: [
    { product_id: 1, product_name: 'A', quantity: 1, unit_price: 100, discount: 0 },
    { product_id: 2, product_name: 'B', quantity: 1, unit_price: 200, discount: 0 },
  ],
  products: [
    { id: 1, name: 'A', tax_rate: 10 } as Product,
    { id: 2, name: 'B', tax_rate: 5 } as Product,
  ],
  settings: {},
  branchId: '1',
  orderType: 'takeaway',
});
assert.equal(fallbackTaxTotals.gross, 300);
assert.equal(fallbackTaxTotals.tax, 20);
assert.equal(fallbackTaxTotals.total, 320);

const branchVatLine: CartLine = {
  product_id: 3,
  product_name: 'Tax Test Product',
  quantity: 1,
  unit_price: 200,
  discount: 0,
};
const branchVatOnce = computePosCheckoutTotals({
  lines: [branchVatLine],
  products: [{ id: 3, name: 'Tax Test Product', tax_rate: 0 } as Product],
  settings: { tax_enabled: true, tax_rate: 14 },
  branchId: '1',
  orderType: 'takeaway',
});
assert.equal(branchVatOnce.tax, 28);
assert.equal(branchVatOnce.total, 228);

const branchVatMultiple = computePosCheckoutTotals({
  lines: [{ ...branchVatLine, quantity: 2 }],
  products: [{ id: 3, name: 'Tax Test Product', tax_rate: 0 } as Product],
  settings: { tax_enabled: true, tax_rate: 14 },
  branchId: '1',
  orderType: 'takeaway',
});
assert.equal(branchVatMultiple.tax, 56);
assert.equal(branchVatMultiple.total, 456);

const goldenCheckout = computePosCheckoutTotals({
  lines: [
    { product_id: 1, product_name: 'Large burger with cheese', quantity: 2, unit_price: 175, discount: 70 },
    { product_id: 2, product_name: 'Side', quantity: 3, unit_price: 100, discount: 0 },
  ],
  products: [{ id: 1, name: 'Large burger with cheese' } as Product, { id: 2, name: 'Side' } as Product],
  settings: {
    tax_enabled: true,
    tax_rate: 14,
    service_charge_enabled: true,
    service_charge_type: 'percentage',
    service_charge_value: 10,
    service_charge_apply_to: 'dine_in',
  },
  branchId: '1',
  orderType: 'dine_in',
  manualDiscount: 40,
  couponDiscount: 54,
});
assert.deepEqual({
  lineGross: goldenCheckout.lineGross,
  gross: goldenCheckout.gross,
  lineDiscount: goldenCheckout.lineDiscount,
  manualDiscount: goldenCheckout.manualDiscount,
  couponDiscount: goldenCheckout.couponDiscount,
  afterDiscount: goldenCheckout.afterDiscount,
  tax: goldenCheckout.tax,
  serviceCharge: goldenCheckout.serviceCharge,
  total: goldenCheckout.total,
}, {
  lineGross: 650,
  gross: 580,
  lineDiscount: 70,
  manualDiscount: 40,
  couponDiscount: 54,
  afterDiscount: 486,
  tax: 68.04,
  serviceCharge: 48.6,
  total: 602.64,
});

const goldenLoyaltyDeliveryCheckout = computePosCheckoutTotals({
  lines: [
    { product_id: 1, product_name: 'Large burger with cheese', quantity: 2, unit_price: 175, discount: 70 },
    { product_id: 2, product_name: 'Side', quantity: 3, unit_price: 100, discount: 0 },
  ],
  products: [{ id: 1, name: 'Large burger with cheese' } as Product, { id: 2, name: 'Side' } as Product],
  settings: {
    tax_enabled: true,
    tax_rate: 14,
    service_charge_enabled: true,
    service_charge_type: 'percentage',
    service_charge_value: 10,
    service_charge_apply_to: 'dine_in',
  },
  branchId: '1',
  orderType: 'dine_in',
  manualDiscount: 40,
  couponDiscount: 54,
  deliveryFee: 30,
  loyaltyDiscount: 10,
});
assert.deepEqual({
  tax: goldenLoyaltyDeliveryCheckout.tax,
  serviceCharge: goldenLoyaltyDeliveryCheckout.serviceCharge,
  deliveryFee: goldenLoyaltyDeliveryCheckout.deliveryFee,
  loyaltyDiscount: goldenLoyaltyDeliveryCheckout.loyaltyDiscount,
  totalBeforeLoyalty: goldenLoyaltyDeliveryCheckout.totalBeforeLoyalty,
  total: goldenLoyaltyDeliveryCheckout.total,
}, {
  tax: 68.04,
  serviceCharge: 48.6,
  deliveryFee: 30,
  loyaltyDiscount: 10,
  totalBeforeLoyalty: 632.64,
  total: 622.64,
});

const scopedPromotion = {
  id: 'promo-1',
  name: 'Selected only',
  type: 'percentage_discount',
  reward_value: 10,
  priority: 10,
  config: {
    schema_version: 2,
    scope_type: 'products',
    product_ids: [1],
    order_types: ['takeaway'],
    stackable: false,
  },
};
const scopedPromotionTotals = computePosCheckoutTotals({
  lines: [
    { product_id: 1, product_name: 'A', quantity: 1, unit_price: 100, discount: 0 },
    { product_id: 2, product_name: 'B', quantity: 1, unit_price: 200, discount: 0 },
  ],
  products: [{ id: 1, name: 'A' } as Product, { id: 2, name: 'B' } as Product],
  promotions: [scopedPromotion],
  settings: { tax_enabled: false },
  branchId: '1',
  orderType: 'takeaway',
});
assert.equal(scopedPromotionTotals.promotionDiscount, 10);
assert.equal(scopedPromotionTotals.total, 290);

const wrongChannelTotals = computePosCheckoutTotals({
  lines: [{ product_id: 1, product_name: 'A', quantity: 1, unit_price: 100, discount: 0 }],
  products: [{ id: 1, name: 'A' } as Product],
  promotions: [scopedPromotion],
  settings: { tax_enabled: false },
  branchId: '1',
  orderType: 'delivery',
});
assert.equal(wrongChannelTotals.promotionDiscount, 0);

const bogoTotals = computePosCheckoutTotals({
  lines: [
    { product_id: 1, product_name: 'A', quantity: 1, unit_price: 10, discount: 0 },
    { product_id: 2, product_name: 'B', quantity: 1, unit_price: 20, discount: 0 },
    { product_id: 3, product_name: 'C', quantity: 1, unit_price: 30, discount: 0 },
  ],
  products: [{ id: 1, name: 'A' } as Product, { id: 2, name: 'B' } as Product, { id: 3, name: 'C' } as Product],
  promotions: [{
    id: 'bogo-1', name: 'Cheapest free', type: 'bogo', reward_value: 100, priority: 10,
    config: {
      schema_version: 2, scope_type: 'all', order_types: ['takeaway'], stackable: false,
      buy_qty: 2, get_qty: 1, discount_percent_on_get: 100,
    },
  }],
  settings: { tax_enabled: false },
  branchId: '1',
  orderType: 'takeaway',
});
assert.equal(bogoTotals.promotionDiscount, 10);

console.log('posTotals.spec.ts: OK');
