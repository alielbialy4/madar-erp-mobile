/**
 * Run: npx tsx src/services/printing/tcpWriteFlush.spec.ts
 */
import assert from 'node:assert/strict';
import {
  SINGLE_WRITE_MAX_BYTES,
  writeBufferFlushed,
  writeSliceFlushed,
  type TcpWriteClient,
} from './tcpWriteFlush';

function makeAsyncWriteClient(delays: number[]): TcpWriteClient & { destroyed: boolean } {
  let call = 0;
  const listeners = new Map<string, Set<() => void>>();
  return {
    destroyed: false,
    write(_data, _encoding, cb) {
      const delay = delays[call] ?? 0;
      call += 1;
      setTimeout(() => {
        cb?.();
      }, delay);
      return true;
    },
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
    },
    removeListener(event, handler) {
      listeners.get(event)?.delete(handler);
    },
  };
}

async function testWriteSliceWaitsForCallback() {
  let callbackAt = 0;
  const client: TcpWriteClient = {
    write(_data, _encoding, cb) {
      setTimeout(() => {
        callbackAt = Date.now();
        cb?.();
      }, 30);
      return true;
    },
    on: () => undefined,
  };
  const startedAt = Date.now();
  await writeSliceFlushed(client, new Uint8Array([1, 2, 3]));
  assert.ok(callbackAt >= startedAt + 25, 'must await native write callback');
}

async function testWriteBufferFlushedSequential() {
  const order: number[] = [];
  let call = 0;
  const client: TcpWriteClient = {
    write(_data, _encoding, cb) {
      const id = call;
      call += 1;
      setTimeout(() => {
        order.push(id);
        cb?.();
      }, 10);
      return true;
    },
    on: () => undefined,
  };
  await writeSliceFlushed(client, new Uint8Array(4));
  await writeSliceFlushed(client, new Uint8Array(4));
  await writeSliceFlushed(client, new Uint8Array(4));
  assert.deepEqual(order, [0, 1, 2]);
}

async function testWriteBufferSingleWriteForReceiptSize() {
  const client = makeAsyncWriteClient([5]);
  const buf = new Uint8Array(80_000);
  const { bytesWritten } = await writeBufferFlushed(client, buf, 4096);
  assert.equal(bytesWritten, 80_000);
}

function testSingleWriteMaxBytes() {
  assert.equal(SINGLE_WRITE_MAX_BYTES, 256 * 1024);
}

async function run() {
  await testWriteSliceWaitsForCallback();
  await testWriteBufferFlushedSequential();
  await testWriteBufferSingleWriteForReceiptSize();
  testSingleWriteMaxBytes();
  console.log('tcpWriteFlush.spec.ts: OK');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
