import type { ShiftDetailedSummary } from '@/types/shifts';
import { withCanonicalShiftTotals } from '@/utils/shiftTotalsCanonical';

export function normalizeShiftSummary(raw: Record<string, unknown>): ShiftDetailedSummary {
  if (raw.totals && raw.invoices) {
    const summary = raw as unknown as ShiftDetailedSummary;
    return {
      ...summary,
      totals: withCanonicalShiftTotals(summary.totals),
    };
  }

  const shift = (raw.shift ?? {}) as Record<string, unknown>;
  const totalsRaw = (raw.totals ?? raw) as Record<string, unknown>;
  const byMethod = (raw.by_payment_method ?? raw.payment_breakdown ?? {}) as Record<string, number>;
  const cashSales = byMethod.cash ?? 0;
  const nonCash = Object.entries(byMethod).reduce(
    (s, [k, v]) => (k === 'cash' ? s : s + (v as number)),
    0,
  );
  const totalSales = Number(raw.total_sales ?? 0);
  const totalRefunds = Number(
    totalsRaw.shift_total_refunds ?? raw.shift_total_refunds ?? raw.total_refunds ?? 0,
  );
  const cashIn = Number(raw.cash_in ?? raw.cash_movements_in ?? 0);
  const cashOut = Number(raw.cash_out ?? raw.cash_movements_out ?? 0);
  const expectedCash = Number(raw.expected_cash ?? 0);
  const startingCash = raw.starting_cash ?? shift.starting_cash ?? 0;
  const user = shift.user as { id?: number; name?: string } | undefined;
  const vault = shift.vault as { id?: string; name?: string } | undefined;
  const drawerCashRefunds = Number(
    totalsRaw.drawer_cash_refund_outflows ?? totalsRaw.cash_refunds ?? 0,
  );
  const netActivity = Number(
    totalsRaw.shift_net_sales_activity ?? totalsRaw.net_revenue ?? totalSales - totalRefunds,
  );

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
    totals: withCanonicalShiftTotals({
      invoice_count: Number(raw.sales_count ?? 0),
      gross_sales: String(totalSales),
      total_paid: String(raw.total_paid ?? 0),
      shift_total_refunds: String(totalRefunds),
      total_refunds: String(totalRefunds),
      refund_count: 0,
      shift_net_sales_activity: String(netActivity),
      net_revenue: String(netActivity),
      total_expenses: '0',
      cash_sales: String(cashSales),
      non_cash_sales: String(nonCash),
      card_payments:
        totalsRaw.card_payments != null
          ? String(totalsRaw.card_payments)
          : byMethod.card != null
            ? String(byMethod.card)
            : undefined,
      instapay_payments:
        totalsRaw.instapay_payments != null
          ? String(totalsRaw.instapay_payments)
          : byMethod.instapay != null
            ? String(byMethod.instapay)
            : undefined,
      electronic_wallet_payments:
        totalsRaw.electronic_wallet_payments != null
          ? String(totalsRaw.electronic_wallet_payments)
          : byMethod.electronic_wallet != null
            ? String(byMethod.electronic_wallet)
            : undefined,
      credit_payments:
        totalsRaw.credit_payments != null ? String(totalsRaw.credit_payments) : undefined,
      layaway_payments:
        totalsRaw.layaway_payments != null ? String(totalsRaw.layaway_payments) : undefined,
      debt_collections:
        totalsRaw.debt_collections != null ? String(totalsRaw.debt_collections) : undefined,
      layaway_collections:
        totalsRaw.layaway_collections != null ? String(totalsRaw.layaway_collections) : undefined,
      allocated_cash_refunds:
        totalsRaw.allocated_cash_refunds != null
          ? String(totalsRaw.allocated_cash_refunds)
          : totalsRaw.cash_method_refunds != null
            ? String(totalsRaw.cash_method_refunds)
            : undefined,
      cash_method_refunds:
        totalsRaw.cash_method_refunds != null ? String(totalsRaw.cash_method_refunds) : undefined,
      non_cash_refunds:
        totalsRaw.non_cash_refunds != null ? String(totalsRaw.non_cash_refunds) : undefined,
      unallocated_refunds:
        totalsRaw.unallocated_refunds != null ? String(totalsRaw.unallocated_refunds) : undefined,
      drawer_cash_refund_outflows: String(drawerCashRefunds),
      cash_refunds: String(drawerCashRefunds),
      cash_deposits: String(cashIn),
      cash_withdrawals: String(cashOut),
      cash_expenses: '0',
      expected_cash: String(expectedCash),
      actual_cash: null,
      variance: null,
    }),
    invoices: [],
    sold_products: [],
    refunds: [],
    expenses: [],
    cash_movements: [],
  };
}
