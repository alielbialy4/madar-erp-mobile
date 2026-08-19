/**
 * R05 refund request idempotency — client UUID lifecycle (mobile).
 * Mirrors web `front/src/helpers/refundClientUuidLifecycle.ts`.
 */

export type RefundClientUuidAction = 'reuse' | 'clear'

export type RefundClientUuidDecision = {
  action: RefundClientUuidAction
  reason: 'success' | 'conflict' | 'legacy_ambiguous' | 'retryable_failure'
}

export function decideRefundClientUuidLifecycle(
  outcome:
    | 'success'
    | {
        status?: number | null
        code?: string | null
      },
): RefundClientUuidDecision {
  if (outcome === 'success') {
    return { action: 'clear', reason: 'success' }
  }

  const code = typeof outcome.code === 'string' ? outcome.code : ''
  if (code === 'refund_idempotency_conflict') {
    return { action: 'clear', reason: 'conflict' }
  }
  if (code === 'refund_idempotency_legacy_ambiguous') {
    return { action: 'clear', reason: 'legacy_ambiguous' }
  }

  return { action: 'reuse', reason: 'retryable_failure' }
}
