/**
 * Run: npx tsx src/services/printing/escposRaster.spec.ts
 */
import assert from 'node:assert/strict';
import UPNG from 'upng-js';
import {
  dotsForPaper,
  monoToPngBase64,
  pngToMonoRaster,
  rasterHasInk,
  trimMonoVerticalWhitespace,
  type MonoRaster,
} from './escposRaster';

function makeTestPngBase64(): string {
  const w = 2;
  const h = 2;
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i += 1) {
    const ink = i % 2 === 0;
    const offset = i * 4;
    rgba[offset] = ink ? 0 : 255;
    rgba[offset + 1] = ink ? 0 : 255;
    rgba[offset + 2] = ink ? 0 : 255;
    rgba[offset + 3] = 255;
  }
  const png = UPNG.encode([rgba.buffer], w, h, 0);
  return Buffer.from(png).toString('base64');
}

const TEST_PNG_BASE64 = makeTestPngBase64();

function base64ToBytes(base64: string): Uint8Array {
  const buf = Buffer.from(base64, 'base64');
  return Uint8Array.from(buf);
}

function testPngToMonoRasterDimensions() {
  const bytes = base64ToBytes(TEST_PNG_BASE64);
  const mono = pngToMonoRaster(bytes, 384);
  assert.ok(mono.width > 0);
  assert.ok(mono.height > 0);
  assert.equal(mono.data.length, Math.ceil(mono.width / 8) * mono.height);
}

function testPngToMonoRasterHasInk() {
  const bytes = base64ToBytes(TEST_PNG_BASE64);
  const mono = pngToMonoRaster(bytes, 384);
  const hasInk = mono.data.some((b) => b !== 0);
  assert.ok(hasInk, 'raster must contain at least one ink dot');
}

function testRasterHasInk() {
  assert.equal(rasterHasInk(TEST_PNG_BASE64, '58mm'), true);
  assert.equal(rasterHasInk('', '58mm'), false);
}

function makeMonoWithBlankMargins(rows: number, inkRow: number): MonoRaster {
  const width = 16;
  const bytesPerRow = Math.ceil(width / 8);
  const data = new Uint8Array(bytesPerRow * rows);
  const inkByte = 0x80;
  data[inkRow * bytesPerRow] = inkByte;
  return { width, height: rows, data };
}

function testTrimMonoVerticalWhitespace() {
  const mono = makeMonoWithBlankMargins(5, 2);
  const trimmed = trimMonoVerticalWhitespace(mono);
  assert.equal(trimmed.height, 1);
  assert.equal(trimmed.width, mono.width);
  assert.ok(trimmed.data.some((b) => b !== 0));
}

function makeMonoAllInk(rows: number): MonoRaster {
  const width = 16;
  const bytesPerRow = Math.ceil(width / 8);
  const data = new Uint8Array(bytesPerRow * rows);
  for (let r = 0; r < rows; r += 1) data[r * bytesPerRow] = 0xff;
  return { width, height: rows, data };
}

function testTrimMonoVerticalWhitespaceNoOp() {
  const mono = makeMonoAllInk(3);
  const trimmed = trimMonoVerticalWhitespace(mono);
  assert.equal(trimmed.height, 3);
  assert.equal(trimmed.data, mono.data);
}

function testDotsForPaper() {
  assert.equal(dotsForPaper('58mm'), 384);
  assert.equal(dotsForPaper('80mm'), 576);
}

function testMonoToPngBase64RoundTrip() {
  const bytes = base64ToBytes(TEST_PNG_BASE64);
  const mono = pngToMonoRaster(bytes, 384);
  const pngBase64 = monoToPngBase64(mono);
  assert.ok(pngBase64.length > 0);
  const roundTrip = pngToMonoRaster(base64ToBytes(pngBase64), mono.width);
  assert.equal(roundTrip.width, mono.width);
  assert.equal(roundTrip.height, mono.height);
  assert.ok(roundTrip.data.some((b) => b !== 0));
}

testPngToMonoRasterDimensions();
testPngToMonoRasterHasInk();
testRasterHasInk();
testTrimMonoVerticalWhitespace();
testTrimMonoVerticalWhitespaceNoOp();
testDotsForPaper();
testMonoToPngBase64RoundTrip();

console.log('escposRaster.spec.ts: OK');
