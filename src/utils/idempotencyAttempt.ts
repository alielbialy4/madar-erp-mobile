import { createUuid } from '@/utils/uuid';

export type IdempotencyKeyHolder = { current: string | null };

/** Keeps one key for all retries of the same user-confirmed mutation. */
export function idempotencyKeyForAttempt(holder: IdempotencyKeyHolder): string {
  if (!holder.current) holder.current = createUuid();
  return holder.current;
}

export function completeIdempotencyAttempt(holder: IdempotencyKeyHolder): void {
  holder.current = null;
}

/**
 * Clear after success, or on deterministic key conflict (422), so the next
 * logical operation gets a fresh key. Keep the key on transient failures.
 */
export function resolveIdempotencyAttemptAfterError(
  holder: IdempotencyKeyHolder,
  err: { status?: number | null; message?: string | null },
): void {
  const status = err.status ?? null;
  const message = typeof err.message === 'string' ? err.message : '';
  if (status === 422 && /مفتاح التكرار|idempotenc/i.test(message)) {
    completeIdempotencyAttempt(holder);
  }
}
