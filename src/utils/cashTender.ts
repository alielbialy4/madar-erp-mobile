/** Cash tender helpers mirrored from web paymentAllocations. */
export function cashAppliedAmount(cashReceived: number, amountDue: number): number {
  if (!Number.isFinite(cashReceived) || cashReceived <= 0) return 0;
  if (!Number.isFinite(amountDue) || amountDue <= 0) return 0;
  return Math.min(cashReceived, amountDue);
}

export function cashChangeAmount(cashReceived: number, amountDue: number): number {
  return Math.max(0, cashReceived - cashAppliedAmount(cashReceived, amountDue));
}

export function cashShortfallAmount(cashReceived: number, amountDue: number): number {
  if (!Number.isFinite(amountDue) || amountDue <= 0) return 0;
  if (!Number.isFinite(cashReceived) || cashReceived <= 0) return amountDue;
  return Math.max(0, amountDue - cashReceived);
}
