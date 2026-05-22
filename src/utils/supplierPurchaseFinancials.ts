/** Remaining payable on a purchase invoice (after returns when API provides it). */
export function purchaseRemainingAmount(
  purchase: {
    remaining_amount?: number | string | null;
    remaining_after_returns?: number | string | null;
    balance_after_returns?: number | string | null;
    balance?: number | string | null;
    total?: number | string | null;
    paid?: number | string | null;
  } | null | undefined,
): number {
  if (!purchase) return 0;
  const direct =
    purchase.remaining_amount
    ?? purchase.remaining_after_returns
    ?? purchase.balance_after_returns;
  if (direct != null && direct !== '') {
    const n = Number(direct);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  const total = Number(purchase.total ?? 0);
  const paid = Number(purchase.paid ?? 0);
  if (!Number.isFinite(total) || !Number.isFinite(paid)) return 0;
  return Math.max(0, total - paid);
}

export function parsePositiveMoneyInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}
