/**
 * Run: npx tsx src/services/printing/receiptCapture.spec.ts
 */
import assert from 'node:assert/strict';
import { resolveCodePageTable } from './codePageTables';
import { normalizeFormEncoding } from './printPathUtils';

function testDefaultCodePageIsClone() {
  const table = resolveCodePageTable();
  assert.equal(table.cp864, 22);
  assert.equal(table.windows1256, 22);
}

function testNormalizeFormEncoding() {
  assert.equal(normalizeFormEncoding('utf8_image'), 'utf8_image');
  assert.equal(normalizeFormEncoding('windows1256'), 'windows1256');
  assert.equal(normalizeFormEncoding('cp864'), 'windows1256');
  assert.equal(normalizeFormEncoding('utf8'), 'windows1256');
}

testDefaultCodePageIsClone();
testNormalizeFormEncoding();

console.log('receiptCapture.spec.ts: OK');
