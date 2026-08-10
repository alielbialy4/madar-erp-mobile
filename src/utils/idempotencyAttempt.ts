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
