/**
 * Run: npx tsx src/services/printing/tcpSendQueue.spec.ts
 */
import assert from 'node:assert/strict';
import { resetTcpSendLocks, withTcpSendLock } from './tcpSendQueue';

async function delay(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function testSerializesConcurrentSends() {
  resetTcpSendLocks();
  const log: string[] = [];
  const first = withTcpSendLock('192.168.1.1:9100', async () => {
    log.push('a-start');
    await delay(40);
    log.push('a-end');
  });
  const second = withTcpSendLock('192.168.1.1:9100', async () => {
    log.push('b-start');
    log.push('b-end');
  });
  await Promise.all([first, second]);
  assert.deepEqual(log, ['a-start', 'a-end', 'b-start', 'b-end']);
}

async function testDifferentPrintersRunInParallel() {
  resetTcpSendLocks();
  const log: string[] = [];
  const a = withTcpSendLock('10.0.0.1:9100', async () => {
    log.push('a-start');
    await delay(30);
    log.push('a-end');
  });
  const b = withTcpSendLock('10.0.0.2:9100', async () => {
    log.push('b-start');
    await delay(10);
    log.push('b-end');
  });
  await Promise.all([a, b]);
  assert.ok(log.indexOf('b-end') < log.indexOf('a-end'), 'different IPs may overlap');
}

async function run() {
  await testSerializesConcurrentSends();
  await testDifferentPrintersRunInParallel();
  console.log('tcpSendQueue.spec.ts: OK');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
