import assert from 'node:assert/strict';
import {
  RECEIPT_PRINT_TOKENS,
  RECEIPT_RASTER_FONT_BOOST,
  scaledReceiptToken,
} from '@/constants/receiptPrintTokens';
import { buildReceiptViewModel } from '@/services/printing/buildReceiptViewModel';
import { dotsForPaper } from '@/services/printing/escposRaster';
import { scaleReceiptCssPx } from '@/services/printing/printTypography';
import type { ReceiptPrintPayload } from '@/types/printing';

assert.equal(RECEIPT_PRINT_TOKENS.orderHeroValue, 21);
assert.equal(RECEIPT_PRINT_TOKENS.grandTotal, 14);
assert.equal(RECEIPT_PRINT_TOKENS.metaRow, 11.5);

assert.equal(scaleReceiptCssPx(21, 12), 21);
assert.equal(scaleReceiptCssPx(14, 12), 14);
assert.equal(scaleReceiptCssPx(11.5, 12), 11.5);
assert.equal(scaleReceiptCssPx(9.5, 12), 9.5);

assert.equal(RECEIPT_RASTER_FONT_BOOST, 2);
assert.equal(scaleReceiptCssPx(21, 12) * RECEIPT_RASTER_FONT_BOOST, 42);
assert.equal(scaleReceiptCssPx(14, 12) * RECEIPT_RASTER_FONT_BOOST, 28);
assert.equal(scaleReceiptCssPx(11.5, 12) * RECEIPT_RASTER_FONT_BOOST, 23);

assert.equal(dotsForPaper('80mm'), 576);
assert.equal(dotsForPaper('58mm'), 384);

const payload: ReceiptPrintPayload = {
  date: '2026-01-01',
  items: [{ name: 'Item', quantity: 1, unit_price: 10 }],
  subtotal: 10,
  discount: 0,
  tax: 0,
  total: 10,
  paid: 10,
  payment_type: 'cash',
  branch_name: 'Test',
  _printSettings: { customer_receipt_font_size: 12 } as ReceiptPrintPayload['_printSettings'],
};
const vm = buildReceiptViewModel(payload);
assert.equal(scaledReceiptToken(vm, 'orderHeroValue'), 42);
assert.equal(scaledReceiptToken(vm, 'grandTotal'), 28);

console.log('receiptPrintTokens.spec: ok');
