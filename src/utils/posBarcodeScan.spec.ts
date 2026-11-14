import assert from 'node:assert/strict';
import { findProductByScan, looksLikeBarcodeScan } from './posBarcodeScan';
import type { Product } from '@/types/api';

const products = [
  { id: 1, name: 'A', barcode: '12345678' },
  { id: 2, name: 'B', barcodes: ['999988887777'] },
  { id: 3, name: 'C' },
] as Product[];

assert.equal(findProductByScan(products, '12345678')?.id, 1);
assert.equal(findProductByScan(products, '999988887777')?.id, 2);
assert.equal(findProductByScan(products, '3')?.id, 3);
assert.equal(findProductByScan(products, 'nope'), undefined);
assert.equal(looksLikeBarcodeScan('12345678'), true);
assert.equal(looksLikeBarcodeScan('123'), false);
assert.equal(looksLikeBarcodeScan('abcdefgh'), false);

console.log('posBarcodeScan.spec.ts: OK');
