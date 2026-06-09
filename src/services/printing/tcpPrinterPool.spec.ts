/**
 * Run: npx tsx src/services/printing/tcpPrinterPool.spec.ts
 */
import assert from 'node:assert/strict';
import { chunkUint8Array, DEFAULT_TCP_CHUNK_SIZE, DEFAULT_TCP_SETTLE_MS } from './tcpChunkUtils';

function testChunkUint8ArrayEmpty() {
  assert.deepEqual(chunkUint8Array(new Uint8Array(0), 4096), []);
}

function testChunkUint8ArraySingle() {
  const buf = new Uint8Array([1, 2, 3]);
  const chunks = chunkUint8Array(buf, 4096);
  assert.equal(chunks.length, 1);
  assert.deepEqual(Array.from(chunks[0]), [1, 2, 3]);
}

function testChunkUint8ArrayMultiple() {
  const buf = new Uint8Array(10);
  for (let i = 0; i < 10; i += 1) buf[i] = i;
  const chunks = chunkUint8Array(buf, 4);
  assert.equal(chunks.length, 3);
  assert.deepEqual(Array.from(chunks[0]), [0, 1, 2, 3]);
  assert.deepEqual(Array.from(chunks[1]), [4, 5, 6, 7]);
  assert.deepEqual(Array.from(chunks[2]), [8, 9]);
}

function testDefaultChunkSize() {
  assert.equal(DEFAULT_TCP_CHUNK_SIZE, 8192);
}

function testDefaultSettleMs() {
  assert.equal(DEFAULT_TCP_SETTLE_MS, 80);
}

testChunkUint8ArrayEmpty();
testChunkUint8ArraySingle();
testChunkUint8ArrayMultiple();
testDefaultChunkSize();
testDefaultSettleMs();

console.log('tcpPrinterPool.spec.ts: OK');
