/**
 * Run: npx tsx src/services/printing/prepareArabicLine.spec.ts
 */
import assert from 'node:assert/strict';
import { encodeForPrinter } from './arabicTextEncode';
import { EscPosBuilder } from './escposBuilder';
import { prepareArabicTextForEncoding, prepareArabicTextForPrinter } from './prepareArabicLine';
import { formatReceiptItemLine, formatTwoColumnLine } from './thermalTextLayout';

function testWindows1256UsesLogicalArabicWithBidi() {
  const logical = 'اختبار الطباعة';
  const prepared = prepareArabicTextForEncoding(logical, 'windows1256');
  assert.notEqual(prepared, logical, 'BiDi should reorder for LTR printer');
  assert.ok(!prepared.includes('\uFE8D'), 'W1256 must not use presentation forms');
  const bytes = encodeForPrinter(logical, 'windows1256');
  assert.equal([...bytes].filter((b) => b === 0x3f).length, 0, 'no question marks');
}

function testCp864UsesPresentationForms() {
  const logical = 'اختبار';
  const prepared = prepareArabicTextForPrinter(logical);
  assert.ok([...prepared].some((ch) => ch.charCodeAt(0) >= 0xfe80), 'CP864 path should emit presentation forms');
  const bytes = encodeForPrinter(logical, 'cp864');
  assert.equal([...bytes].filter((b) => b === 0x3f).length, 0, 'cp864 maps shaped glyphs');
}

function testMixedArabicLatinLine() {
  const line = 'الإجمالي 123.45 ج.م';
  const bytes = encodeForPrinter(line, 'windows1256');
  assert.ok(bytes.length > 0);
  assert.equal([...bytes].filter((b) => b === 0x3f).length, 0);
}

function testEscTCodePageOnEachLine() {
  const buf = EscPosBuilder.forProfile({ code_page_preset: 'generic_clone' })
    .init()
    .textLine('اختبار', 48, 'windows1256')
    .build();
  assert.equal(buf[0], 0x1b);
  assert.equal(buf[1], 0x40, 'init');
  assert.equal(buf[2], 0x1b);
  assert.equal(buf[3], 0x74);
  assert.equal(buf[4], 22, 'ESC t 22 Arabic W1256');
}

function testTwoColumnLayoutWidth() {
  const line = formatTwoColumnLine('123.45', 'منتج x2', 48);
  assert.equal([...line].length, 48);
  const item = formatReceiptItemLine('قهوة', 1, '50.00', 32);
  assert.equal([...item].length, 32);
}

testWindows1256UsesLogicalArabicWithBidi();
testCp864UsesPresentationForms();
testMixedArabicLatinLine();
testEscTCodePageOnEachLine();
testTwoColumnLayoutWidth();

console.log('prepareArabicLine.spec.ts: OK');
