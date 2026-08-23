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

assert.deepEqual(resolveLogoMaxDimensions('80mm', 100), { maxWidth: 220, maxHeight: 100 });
assert.deepEqual(resolveLogoMaxDimensions('80mm', 150), { maxWidth: 330, maxHeight: 150 });
assert.deepEqual(resolveLogoMaxDimensions('58mm', 100), { maxWidth: 160, maxHeight: 72 });
assert.deepEqual(resolveLogoMaxDimensions('80mm', 30), { maxWidth: 110, maxHeight: 50 });

console.log('printLogoSize.spec.ts: OK');
