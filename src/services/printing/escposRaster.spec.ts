/**
 * Run: npx tsx src/services/printing/escposRaster.spec.ts
 */
import assert from 'node:assert/strict';
import UPNG from 'upng-js';
import { buildEscPosFromPngBase64, pngToMonoRaster, rasterHasInk } from './escposRaster';

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

function testBuildEscPosFromPngBase64StartsWithInit() {
  const buf = buildEscPosFromPngBase64(TEST_PNG_BASE64, '58mm', false);
  assert.equal(buf[0], 0x1b);
  assert.equal(buf[1], 0x40);
  assert.equal(buf[2], 0x1b);
  assert.equal(buf[3], 0x33);
  assert.equal(buf[4], 0x00);
  assert.ok(buf.length > 8, 'buffer must include raster payload');
}

testPngToMonoRasterDimensions();
testPngToMonoRasterHasInk();
testRasterHasInk();
testBuildEscPosFromPngBase64StartsWithInit();

console.log('escposRaster.spec.ts: OK');
