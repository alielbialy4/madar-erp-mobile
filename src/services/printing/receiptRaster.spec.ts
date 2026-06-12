/**
 * Run: npx tsx src/services/printing/receiptRaster.spec.ts
 */
import assert from 'node:assert/strict';
import { usesRasterEncoding } from './printPathUtils';

function testUsesRasterEncoding() {
  assert.equal(
    usesRasterEncoding({ encoding: 'utf8_image', mode: 'escpos_image' } as never),
    true,
  );
  assert.equal(
    usesRasterEncoding({ encoding: 'windows1256', mode: 'escpos_text' } as never),
    false,
  );
}

testUsesRasterEncoding();

console.log('receiptRaster.spec.ts: OK');
