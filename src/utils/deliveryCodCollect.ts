/**
 * Web CollectAmountDialog financial guards for driver COD on deliver.
 */

export type DeliveryCodCollectInput = {
  expectedAmount: number;
  collectedAmount: number;
  driverEarning?: number | null;
  canPartialWaiver: boolean;
  partialConfirmed: boolean;
  collectionNote: string;
};

export type DeliveryCodCollectGate =
  | { ok: true; isPartial: boolean }
  | { ok: false; reason: string };

/** Reject entering driver net (expected - earning) instead of gross COD. */
export function isLikelyDriverNetMistake(
  expectedAmount: number,
  collectedAmount: number,
  driverEarning: number | null | undefined,
): boolean {
  const earning = Number(driverEarning ?? 0);
  if (!(earning > 0) || !(expectedAmount > 0)) return false;
  if (!(collectedAmount + 0.0001 < expectedAmount)) return false;
  return Math.abs(expectedAmount - collectedAmount - earning) <= 0.009;
}

export function validateDeliveryCodCollect(input: DeliveryCodCollectInput): DeliveryCodCollectGate {
  const expected = Math.max(0, Number(input.expectedAmount) || 0);
  const collected = Number(input.collectedAmount);
  if (!Number.isFinite(collected) || collected < 0) {
    return { ok: false, reason: 'أدخل مبلغًا محصّلًا صالحًا (لا يكون سالبًا).' };
  }
  if (collected <= 0) {
    return { ok: false, reason: 'أدخل مبلغًا محصّلًا أكبر من صفر.' };
  }
  if (expected > 0 && collected > expected + 0.0001) {
    return { ok: false, reason: 'المبلغ المحصّل لا يمكن أن يتجاوز المبلغ المطلوب.' };
  }
  if (isLikelyDriverNetMistake(expected, collected, input.driverEarning)) {
    return {
      ok: false,
      reason: 'يبدو أنك أدخلت صافي السائق وليس إجمالي التحصيل. أدخل المبلغ الإجمالي المطلوب من العميل.',
    };
  }
  const isPartial = expected > 0 && collected + 0.0001 < expected;
  if (isPartial && !input.canPartialWaiver) {
    return { ok: false, reason: 'التحصيل الجزئي يحتاج صلاحية اعتماد فرق التحصيل.' };
  }
  if (isPartial && !input.partialConfirmed) {
    return { ok: false, reason: 'أكّد صراحة اعتماد فرق التحصيل الجزئي.' };
  }
  if (isPartial && input.collectionNote.trim().length < 10) {
    return { ok: false, reason: 'اكتب سببًا واضحًا للتحصيل الجزئي لا يقل عن 10 أحرف.' };
  }
  return { ok: true, isPartial };
}

export function handoverPreview(collectedAmount: number, driverEarning: number | null | undefined): number {
  const earning = Number(driverEarning ?? 0);
  return Math.max(0, (Number(collectedAmount) || 0) - (Number.isFinite(earning) ? earning : 0));
}
