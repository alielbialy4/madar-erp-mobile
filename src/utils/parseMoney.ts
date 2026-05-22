/** Mirrors `front/src/helpers/parseApiMoney` — first finite number from candidates */
export function parseApiMoneyFirst(...values: unknown[]): number | null {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const n = Number(value.replace(/,/g, ''));
      if (Number.isFinite(n)) return n;
    }
    if (typeof value === 'object' && value !== null && 'balance' in value) {
      const nested = parseApiMoneyFirst((value as { balance?: unknown }).balance);
      if (nested !== null) return nested;
    }
  }
  return null;
}
