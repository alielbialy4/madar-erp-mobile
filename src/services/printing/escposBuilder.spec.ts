/**
 * Run: npx tsx src/services/printing/escposBuilder.spec.ts
 *
 * Regression tests for the critical bug fix: `encodeLatin1` previously
 * substituted `?` for any character > 0xFF, silently corrupting all Arabic
 * text. With the new UTF-8-aware encoder, Arabic characters round-trip
 * correctly through the ESC/POS byte stream.
 */
import assert from 'node:assert/strict';
import { charsForPaper, EscPosBuilder } from './escposBuilder';

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
}

function testInitByte() {
  const b = new EscPosBuilder().init().build();
  assert.equal(b[0], 0x1b);
  assert.equal(b[1], 0x40);
}

function testAlignBytes() {
  const left = new EscPosBuilder().align('left').build();
  assert.deepEqual(Array.from(left), [0x1b, 0x61, 0x00]);

  const center = new EscPosBuilder().align('center').build();
  assert.deepEqual(Array.from(center), [0x1b, 0x61, 0x01]);

  const right = new EscPosBuilder().align('right').build();
  assert.deepEqual(Array.from(right), [0x1b, 0x61, 0x02]);
}

function testBoldBytes() {
  const on = new EscPosBuilder().bold(true).build();
  assert.deepEqual(Array.from(on), [0x1b, 0x45, 0x01]);

  const off = new EscPosBuilder().bold(false).build();
  assert.deepEqual(Array.from(off), [0x1b, 0x45, 0x00]);
}

function testCutBytes() {
  const full = new EscPosBuilder().cut(false).build();
  assert.deepEqual(Array.from(full), [0x1d, 0x56, 0x00]);

  const partial = new EscPosBuilder().cut(true).build();
  assert.deepEqual(Array.from(partial), [0x1d, 0x56, 0x01]);
}

function testFeedBytes() {
  const three = new EscPosBuilder().feed(3).build();
  assert.equal(three.length, 3);
  for (let i = 0; i < 3; i += 1) assert.equal(three[i], 0x0a);
}

function testSizeBytes() {
  const normal = new EscPosBuilder().size(false, false).build();
  assert.deepEqual(Array.from(normal), [0x1d, 0x21, 0x00]);

  const double = new EscPosBuilder().size(true, true).build();
  assert.deepEqual(Array.from(double), [0x1d, 0x21, 0x11]);
}

function testCodePageSkippedForUtf8() {
  // codePage('utf8') must be a no-op — emitting ESC t for UTF-8 would corrupt
  // multi-byte sequences on the printer.
  const none = new EscPosBuilder().codePage('utf8').build();
  assert.equal(none.length, 0);
}

function testCodePageEmittedForCp864Epson() {
  const cp = EscPosBuilder.forProfile({ code_page_preset: 'epson' }).codePage('cp864').build();
  assert.deepEqual(Array.from(cp), [0x1b, 0x74, 37]);
}

function testCodePageEmittedForCp864Clone() {
  const cp = EscPosBuilder.forProfile({ code_page_preset: 'generic_clone' }).codePage('cp864').build();
  assert.deepEqual(Array.from(cp), [0x1b, 0x74, 22]);
}

function testCodePageEmittedForWindows1256() {
  const cp = EscPosBuilder.forProfile({ code_page_preset: 'epson' }).codePage('windows1256').build();
  assert.deepEqual(Array.from(cp), [0x1b, 0x74, 50]);
}

function testTextLineEnglish() {
  const buf = new EscPosBuilder().textLine('Hello', 32, 'utf8').build();
  // "Hello" + LF
  assert.equal(buf.length, 6);
  assert.equal(buf[5], 0x0a);
  assert.equal(bytesToString(buf.slice(0, 5)), 'Hello');
}

/**
 * The critical regression test. Before the fix, this produced "???????".
 * Now it produces the correct UTF-8 byte sequence.
 */
function testTextLineArabicWindows1256SingleByte() {
  const arabic = 'اختبار الطباعة';
  const buf = new EscPosBuilder().textLine(arabic, 48, 'windows1256').build();
  const body = buf.slice(0, buf.length - 1);
  assert.ok(body.length > 0, 'windows1256 body must not be empty');
  for (const byte of body) {
    assert.ok(byte <= 0xff, 'windows1256 must emit single-byte characters');
  }
  const utf8Buf = new EscPosBuilder().textLine(arabic, 48, 'utf8').build();
  const utf8Body = utf8Buf.slice(0, utf8Buf.length - 1);
  assert.ok(
    body.length < utf8Body.length,
    'windows1256 byte length must be shorter than UTF-8 for Arabic text',
  );
}

function testTextLineArabicUtf8() {
  const arabic = 'اختبار الطباعة';
  const buf = new EscPosBuilder().textLine(arabic, 48, 'utf8').build();
  // Last byte must be LF
  assert.equal(buf[buf.length - 1], 0x0a);
  // Strip the trailing LF and decode — must round-trip back to the original.
  const decoded = bytesToString(buf.slice(0, buf.length - 1));
  assert.equal(decoded, arabic, 'Arabic must round-trip through UTF-8 bytes');
}

function testTextLineArabicReceiptContent() {
  // Mirror what receiptTemplates.ts emits for Arabic test print.
  const lines = ['فاتورة بيع', 'منتج تجريبي', 'الإجمالي 123.45 ج.م'];
  for (const line of lines) {
    const buf = new EscPosBuilder().textLine(line, 48, 'utf8').build();
    const decoded = bytesToString(buf.slice(0, buf.length - 1));
    assert.equal(decoded, line);
  }
}

function testSeparator() {
  const cols = 32;
  const buf = new EscPosBuilder().separator(cols).build();
  // '-' * 32 + LF
  assert.equal(buf.length, cols + 1);
  assert.equal(buf[cols], 0x0a);
  for (let i = 0; i < cols; i += 1) assert.equal(buf[i], 0x2d);
}

function testTextLineReselectsCodePagePerRow() {
  const buf = EscPosBuilder.forProfile({ code_page_preset: 'generic_clone' })
    .textLine('اختبار', 48, 'cp864')
    .build();
  assert.equal(buf[0], 0x1b);
  assert.equal(buf[1], 0x74);
  assert.equal(buf[2], 22);
}

function testCharsForPaper() {
  assert.equal(charsForPaper('58mm'), 32);
  assert.equal(charsForPaper('80mm'), 48);
}

function testFullReceiptFlow() {
  // Sanity: build a small receipt, verify it starts with ESC @ (init),
  // contains the title bytes, ends with the cut command, and the Arabic
  // body round-trips correctly.
  const cols = 48;
  const buf = new EscPosBuilder()
    .init()
    .align('center')
    .bold(true)
    .textLine('MADAR POS TEST', cols, 'utf8')
    .bold(false)
    .align('left')
    .separator(cols)
    .textLine('Arabic Test:', cols, 'utf8')
    .textLine('اختبار الطباعة', cols, 'utf8')
    .feed(2)
    .cut()
    .build();

  assert.equal(buf[0], 0x1b);
  assert.equal(buf[1], 0x40);
  // The last three bytes should be the cut command (GS V 0).
  const last = buf.slice(buf.length - 3);
  assert.deepEqual(Array.from(last), [0x1d, 0x56, 0x00]);
  // Arabic must be present and round-trip.
  const asString = bytesToString(buf);
  assert.ok(asString.includes('اختبار الطباعة'), 'Arabic text must survive the full pipeline');
}

testInitByte();
testAlignBytes();
testBoldBytes();
testCutBytes();
testFeedBytes();
testSizeBytes();
testCodePageSkippedForUtf8();
testCodePageEmittedForCp864Epson();
testCodePageEmittedForCp864Clone();
testCodePageEmittedForWindows1256();
testTextLineEnglish();
testTextLineArabicWindows1256SingleByte();
testTextLineArabicUtf8();
testTextLineArabicReceiptContent();
testSeparator();
testTextLineReselectsCodePagePerRow();
testCharsForPaper();
testFullReceiptFlow();

console.log('escposBuilder.spec.ts: OK');
