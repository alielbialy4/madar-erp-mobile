/**
 * Phase 0 mobile client idempotency attempt lifecycle proofs.
 */
import assert from 'node:assert/strict';
import {
  completeIdempotencyAttempt,
  idempotencyKeyForAttempt,
  resolveIdempotencyAttemptAfterError,
} from './idempotencyAttempt';

// same key across retries via idempotencyKeyForAttempt
const attempt = { current: null as string | null };
const first = idempotencyKeyForAttempt(attempt);
assert.ok(first.length > 0, 'idempotencyKeyForAttempt must mint a key');
assert.equal(
  idempotencyKeyForAttempt(attempt),
  first,
  'a response-loss retry must keep its original key',
);

// clear on success via completeIdempotencyAttempt
completeIdempotencyAttempt(attempt);
assert.equal(attempt.current, null, 'completeIdempotencyAttempt must clear the holder');
assert.notEqual(
  idempotencyKeyForAttempt(attempt),
  first,
  'a completed mutation must start a new attempt',
);

// keep on transient
attempt.current = first;
resolveIdempotencyAttemptAfterError(attempt, { status: 500, message: 'transient' });
assert.equal(attempt.current, first, 'transient 500 failures must keep the key');
resolveIdempotencyAttemptAfterError(attempt, { status: null, message: 'Network Error' });
assert.equal(attempt.current, first, 'network-style failures must keep the key');

// clear on conflict via resolveIdempotencyAttemptAfterError
resolveIdempotencyAttemptAfterError(attempt, {
  status: 422,
  message: 'مفتاح التكرار مستخدم ببيانات مختلفة',
});
assert.equal(attempt.current, null, 'Arabic مفتاح التكرار 422 conflict must clear the key');

attempt.current = first;
resolveIdempotencyAttemptAfterError(attempt, {
  status: 422,
  message: 'Idempotency key conflict',
});
assert.equal(attempt.current, null, 'English idempotenc 422 conflict must clear the key');

console.log('idempotencyAttempt.spec.ts: OK');
