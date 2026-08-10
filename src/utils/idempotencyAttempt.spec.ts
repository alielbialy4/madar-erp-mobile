import assert from 'node:assert/strict';
import { completeIdempotencyAttempt, idempotencyKeyForAttempt } from './idempotencyAttempt';

const attempt = { current: null as string | null };
const first = idempotencyKeyForAttempt(attempt);
assert.equal(idempotencyKeyForAttempt(attempt), first, 'a response-loss retry must keep its original key');
completeIdempotencyAttempt(attempt);
assert.notEqual(idempotencyKeyForAttempt(attempt), first, 'a completed mutation must start a new attempt');

console.log('idempotencyAttempt.spec.ts: OK');
