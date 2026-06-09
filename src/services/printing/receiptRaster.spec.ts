/**
 * Run: npx tsx src/services/printing/receiptRaster.spec.ts
 */
import assert from 'node:assert/strict';
import { pickFallbackStep, TEXT_FALLBACK_STEPS, usesRasterEncoding } from './receiptRasterFallback';

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

function testTextFallbackStepOrder() {
  // Primary text fallback must be cp864 + clone (table 22) per escpos-coffee #44
  assert.equal(TEXT_FALLBACK_STEPS[0].encoding, 'cp864');
  assert.equal(TEXT_FALLBACK_STEPS[0].code_page_preset, 'generic_clone');
  assert.equal(TEXT_FALLBACK_STEPS[1].encoding, 'windows1256');
}

function testPickFallbackForUtf8ImageProfile() {
  const step = pickFallbackStep({ encoding: 'utf8_image', mode: 'escpos_image' } as never);
  assert.equal(step.path, 'text_cp864_clone');
}

testUsesRasterEncoding();
testTextFallbackStepOrder();
testPickFallbackForUtf8ImageProfile();

console.log('receiptRaster.spec.ts: OK');
