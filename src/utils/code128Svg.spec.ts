import assert from 'node:assert/strict';
import { buildBarcodeLabelHtml, buildCode128Svg, validateCode128Value } from './code128Svg';

const svg = buildCode128Svg('ABC-123');
assert.match(svg, /^<svg /);
assert.match(svg, /<rect /);
assert.doesNotMatch(svg, /undefined/);
assert.doesNotThrow(() => validateCode128Value(' ABC-123 '));
assert.throws(() => buildCode128Svg(''), /1-128 printable ASCII/);
assert.throws(() => buildCode128Svg('منتج-1'), /1-128 printable ASCII/);
assert.throws(() => buildCode128Svg('A\\nB'), /1-128 printable ASCII/);
assert.throws(() => buildCode128Svg('A'.repeat(129)), /1-128 printable ASCII/);

const html = buildBarcodeLabelHtml([
  { name: 'منتج <اختبار>', barcode: 'ABC-123', price: '12.50', copies: 2 },
]);
assert.match(html, /ABC-123/);
assert.match(html, /منتج &lt;اختبار&gt;/);
assert.equal((html.match(/class="label"/g) ?? []).length, 2);
assert.throws(() => buildBarcodeLabelHtml([{ name: 'A', barcode: 'A', copies: 0 }]), /positive whole number/);
assert.throws(() => buildBarcodeLabelHtml([{ name: 'A', barcode: 'A', copies: 501 }]), /maximum of 500/);
assert.throws(() => buildBarcodeLabelHtml([{ name: 'A', barcode: 'A', copies: Number.POSITIVE_INFINITY }]), /positive whole number/);
assert.throws(() => buildBarcodeLabelHtml([{ name: 'A', barcode: 'غير مدعوم', copies: 1 }]), /1-128 printable ASCII/);

console.log('code128Svg.spec.ts: OK');
