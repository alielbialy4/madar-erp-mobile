import assert from 'node:assert/strict';
import { withCaptureTimeout } from '@/services/printing/printCaptureTimeout';

async function run() {
  const slow = new Promise<string>((resolve) => {
    setTimeout(() => resolve('late'), 200);
  });
  await assert.rejects(() => withCaptureTimeout(slow, 50), /انتهت مهلة التقاط الصورة/);

  const fast = Promise.resolve('ok');
  assert.equal(await withCaptureTimeout(fast, 50), 'ok');

  console.log('printCaptureTimeout.spec: ok');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
