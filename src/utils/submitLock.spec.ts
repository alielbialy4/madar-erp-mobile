import assert from 'node:assert/strict';
import { tryAcquireSubmitLock } from './submitLock';

const lock = { current: false };
assert.equal(tryAcquireSubmitLock(lock), true);
assert.equal(tryAcquireSubmitLock(lock), false);
lock.current = false;
assert.equal(tryAcquireSubmitLock(lock), true);

console.log('submitLock.spec.ts: OK');
