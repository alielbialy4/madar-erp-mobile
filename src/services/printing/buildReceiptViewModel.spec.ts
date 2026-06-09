import assert from 'node:assert/strict';
import { buildReceiptViewModel } from './buildReceiptViewModel';
import { normalizeBranchPrintSettings } from '@/utils/branchPrintSettings';

const settings = normalizeBranchPrintSettings({
  receipt_show_invoice_number: true,
  receipt_show_invoice_barcode: true,
  receipt_show_print_sequence: true,
});

const basePayload = {
  branch_name: 'فرع تجريبي',
  cashier_name: 'كاشير',
  date: '2026-01-01 12:00',
  server_invoice_number: 'INV-100',
  print_sequence: 7,
  items: [{ name: 'منتج', quantity: 1, unit_price: 10, line_total: 10 }],
  subtotal: 10,
  discount: 0,
  tax: 0,
  total: 10,
  paid: 10,
  payment_type: 'نقدي',
  _printSettings: settings,
};

assert.equal(buildReceiptViewModel(basePayload).showBarcode, true);
assert.equal(buildReceiptViewModel(basePayload).showInvoiceInMeta, false);
assert.equal(buildReceiptViewModel(basePayload).showOrderHero, true);

const noBarcode = buildReceiptViewModel({
  ...basePayload,
  _printSettings: { ...settings, receipt_show_invoice_barcode: false },
});
assert.equal(noBarcode.showBarcode, false);
assert.equal(noBarcode.showInvoiceInMeta, true);

const splitPay = buildReceiptViewModel({
  ...basePayload,
  paid: 15,
  change: 5,
  payment_breakdown: [
    { label: 'نقدي', amount: 10 },
    { label: 'بطاقة', amount: 5 },
  ],
});
assert.equal(splitPay.paymentBreakdown.length, 2);
assert.equal(splitPay.showPaid, true);

const coupon = buildReceiptViewModel({
  ...basePayload,
  coupon_code: 'SAVE',
  coupon_discount: 2,
});
assert.equal(coupon.couponDiscount, 2);
assert.equal(coupon.couponCode, 'SAVE');

const vm = buildReceiptViewModel(basePayload);
assert.equal(vm.scaled(21), 21);
assert.equal(vm.scaled(14), 14);
assert.equal(vm.scaled(11.5), 11.5);

console.log('buildReceiptViewModel.spec: ok');
