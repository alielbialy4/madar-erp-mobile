export function parsePositiveAmount(amountInput: string): number | null {
  const amount = Number(amountInput);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

/** Mirror web `canWithdrawWalletAmount` — never allow overdraft on device. */
export function canWithdrawWalletAmount(amountInput: string, walletBalance: number): boolean {
  const amount = parsePositiveAmount(amountInput);
  return amount !== null && Number.isFinite(walletBalance) && amount <= walletBalance;
}
