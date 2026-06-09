import assert from 'node:assert/strict';
import { RECEIPT_PRINT_TOKENS } from '@/constants/receiptPrintTokens';
import { scaleReceiptCssPx } from '@/services/printing/printTypography';

assert.equal(RECEIPT_PRINT_TOKENS.orderHeroValue, 21);
assert.equal(RECEIPT_PRINT_TOKENS.grandTotal, 14);
assert.equal(RECEIPT_PRINT_TOKENS.metaRow, 11.5);

assert.equal(scaleReceiptCssPx(21, 12), 20);
assert.equal(scaleReceiptCssPx(14, 12), 13.3);
assert.equal(scaleReceiptCssPx(11.5, 12), 10.9);
assert.equal(scaleReceiptCssPx(9.5, 12), 9);

console.log('receiptPrintTokens.spec: ok');
