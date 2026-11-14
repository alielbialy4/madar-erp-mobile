import assert from 'node:assert/strict';
import { buildBarcodeLabelHtml, buildCode128Svg } from './code128Svg';

const svg = buildCode128Svg('ABC-123');
assert.match(svg, /^<svg /);
assert.match(svg, /<rect /);
assert.doesNotMatch(svg, /undefined/);

const html = buildBarcodeLabelHtml([
  { name: 'منتج <اختبار>', barcode: 'ABC-123', price: '12.50', copies: 2 },
]);
assert.match(html, /ABC-123/);
assert.match(html, /منتج &lt;اختبار&gt;/);
assert.equal((html.match(/class="label"/g) ?? []).length, 2);

console.log('code128Svg.spec.ts: OK');
