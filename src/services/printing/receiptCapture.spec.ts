/**
 * Run: npx tsx src/services/printing/receiptCapture.spec.ts
 */
import assert from 'node:assert/strict';
import { resolveCodePageTable } from './codePageTables';
import { pickFallbackStep } from './receiptRasterFallback';

function testDefaultCodePageIsClone() {
  const table = resolveCodePageTable();
  assert.equal(table.cp864, 22);
  assert.equal(table.windows1256, 50);
}

function testPickFallbackStepRespectsProfileTextEncoding() {
  const w1256 = pickFallbackStep({
    encoding: 'windows1256',
    mode: 'escpos_text',
    code_page_preset: 'epson',
  } as never);
  assert.equal(w1256.encoding, 'windows1256');
  assert.equal(w1256.path, 'text_windows1256');

  const cp864Clone = pickFallbackStep({
    encoding: 'cp864',
    mode: 'escpos_text',
    code_page_preset: 'generic_clone',
  } as never);
  assert.equal(cp864Clone.encoding, 'cp864');
  assert.equal(cp864Clone.path, 'text_cp864_clone');
}

function testPickFallbackStepDefaultsToCloneCp864() {
  const step = pickFallbackStep({
    encoding: 'utf8_image',
    mode: 'escpos_image',
  } as never);
  assert.equal(step.encoding, 'cp864');
  assert.equal(step.code_page_preset, 'generic_clone');
}

testDefaultCodePageIsClone();
testPickFallbackStepRespectsProfileTextEncoding();
testPickFallbackStepDefaultsToCloneCp864();

console.log('receiptCapture.spec.ts: OK');
