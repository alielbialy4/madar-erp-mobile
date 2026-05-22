import type { ShiftDetailedSummary } from '@/types/shifts';

export function normalizeShiftSummary(raw: Record<string, unknown>): ShiftDetailedSummary {
  if (raw.totals && raw.invoices) {
    return raw as unknown as ShiftDetailedSummary;
  }

  const shift = (raw.shift ?? {}) as Record<string, unknown>;
  const byMethod = (raw.by_payment_method ?? raw.payment_breakdown ?? {}) as Record<string, number>;
  const cashSales = byMethod.cash ?? 0;
  const nonCash = Object.entries(byMethod).reduce(
    (s, [k, v]) => (k === 'cash' ? s : s + (v as number)),
    0,
  );
  const totalSales = Number(raw.total_sales ?? 0);
  const totalRefunds = Number(raw.total_refunds ?? 0);
  const cashIn = Number(raw.cash_in ?? raw.cash_movements_in ?? 0);
  const cashOut = Number(raw.cash_out ?? raw.cash_movements_out ?? 0);
  const expectedCash = Number(raw.expected_cash ?? 0);
  const startingCash = raw.starting_cash ?? shift.starting_cash ?? 0;
  const user = shift.user as { id?: number; name?: string } | undefined;
  const vault = shift.vault as { id?: string; name?: string } | undefined;

  return {
    shift: {
      id: String(shift.id ?? ''),
      shift_no: (shift.shift_no as number | null) ?? null,
      branch: (shift.branch as ShiftDetailedSummary['shift']['branch']) ?? null,
      cashier: user?.id ? { id: user.id, name: String(user.name ?? '') } : null,
      vault: vault?.id ? { id: vault.id, name: String(vault.name ?? '') } : null,
      opened_at: (shift.opened_at as string | null) ?? null,
      closed_at: (shift.closed_at as string | null) ?? null,
      status: String(shift.status ?? 'open'),
      starting_cash: String(startingCash),
    },
    totals: {
      invoice_count: Number(raw.sales_count ?? 0),
      gross_sales: String(totalSales),
      total_paid: String(raw.total_paid ?? 0),
      total_refunds: String(totalRefunds),
      refund_count: 0,
      net_revenue: String(totalSales - totalRefunds),
      total_expenses: '0',
      cash_sales: String(cashSales),
      non_cash_sales: String(nonCash),
      cash_refunds: String(totalRefunds),
      cash_deposits: String(cashIn),
      cash_withdrawals: String(cashOut),
      cash_expenses: '0',
      expected_cash: String(expectedCash),
      actual_cash: null,
      variance: null,
    },
    invoices: [],
    sold_products: [],
    refunds: [],
    expenses: [],
    cash_movements: [],
  };
}
