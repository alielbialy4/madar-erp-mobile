/**
 * Run: npx tsx src/services/printing/escposStripRaster.spec.ts
 */
import assert from 'node:assert/strict';
import {
  buildEscPosStripJob,
  buildGsV0StripPacket,
  sliceMonoIntoStrips,
  STRIP_HEIGHT_PX,
} from './escposStripRaster';
import type { MonoRaster } from './escposRaster';

function makeMono(width: number, height: number, inkRow = 0): MonoRaster {
  const bytesPerRow = Math.ceil(width / 8);
  const data = new Uint8Array(bytesPerRow * height);
  if (height > 0) {
    data[inkRow * bytesPerRow] = 0x80;
  }
  return { width, height, data };
}

function testSlice576x100() {
  const mono = makeMono(576, 100, 10);
  const strips = sliceMonoIntoStrips(mono, STRIP_HEIGHT_PX);
  assert.equal(strips.length, 3);
  assert.equal(strips[0]!.height, 48);
  assert.equal(strips[1]!.height, 48);
  assert.equal(strips[2]!.height, 4);
}

function testSliceEmptyHeight() {
  assert.deepEqual(sliceMonoIntoStrips(makeMono(576, 0)), []);
}

function testGsV0Header576x48() {
  const strip = makeMono(576, 48);
  const packet = buildGsV0StripPacket(strip);
  assert.deepEqual(Array.from(packet.slice(0, 8)), [0x1d, 0x76, 0x30, 0x00, 72, 0, 48, 0]);
}

function testGsV0Header384x48() {
  const strip = makeMono(384, 48);
  const packet = buildGsV0StripPacket(strip);
  assert.deepEqual(Array.from(packet.slice(0, 8)), [0x1d, 0x76, 0x30, 0x00, 48, 0, 48, 0]);
}

function testLastStripPartialHeight() {
  const mono = makeMono(576, 100);
  const strips = sliceMonoIntoStrips(mono, STRIP_HEIGHT_PX);
  const lastPacket = buildGsV0StripPacket(strips[2]!);
  assert.equal(lastPacket[6], 4);
  assert.equal(lastPacket[7], 0);
}

function testBuildEscPosStripJobStructure() {
  const job = buildEscPosStripJob(makeMono(576, 100), true);
  assert.equal(job.stripCount, 3);
  assert.equal(job.preamble[0], 0x1b);
  assert.equal(job.preamble[1], 0x40);
  assert.ok(Array.from(job.epilogue).includes(0x1d));
  assert.ok(job.totalBytes > job.preamble.length + job.epilogue.length);
}

function testBuildEscPosStripJobNoCut() {
  const job = buildEscPosStripJob(makeMono(384, 48), false);
  assert.equal(job.stripCount, 1);
  assert.equal(job.epilogue.length, 3);
}

function run() {
  testSlice576x100();
  testSliceEmptyHeight();
  testGsV0Header576x48();
  testGsV0Header384x48();
  testLastStripPartialHeight();
  testBuildEscPosStripJobStructure();
  testBuildEscPosStripJobNoCut();
  console.log('escposStripRaster.spec.ts: all passed');
}

run();
