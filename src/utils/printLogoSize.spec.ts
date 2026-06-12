/**
 * Run: npx tsx src/utils/printLogoSize.spec.ts
 */
import assert from 'node:assert/strict';
import {
  clampLogoScale,
  DEFAULT_LOGO_SCALE,
  resolveLogoMaxDimensions,
} from './printLogoSize';

assert.equal(clampLogoScale(undefined), DEFAULT_LOGO_SCALE);
assert.equal(clampLogoScale(30), 50);
assert.equal(clampLogoScale(250), 200);

assert.deepEqual(resolveLogoMaxDimensions('80mm', 100), { maxWidth: 100, maxHeight: 48 });
assert.deepEqual(resolveLogoMaxDimensions('80mm', 150), { maxWidth: 150, maxHeight: 72 });
assert.deepEqual(resolveLogoMaxDimensions('58mm', 100), { maxWidth: 90, maxHeight: 40 });
assert.deepEqual(resolveLogoMaxDimensions('80mm', 30), { maxWidth: 50, maxHeight: 24 });

console.log('printLogoSize.spec.ts: OK');
