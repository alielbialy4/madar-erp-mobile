import type { ShiftCloseReportPayload, ShiftSummaryPayload } from '@/types/printing';
import type { ShiftDetailedSummary } from '@/types/shifts';
import { shiftClosePrintLabels } from '@/constants/printLabels';
import { money, numberText, dateText } from '@/utils/format';
import { normalizeShiftSummary } from '@/utils/shiftSummaryNormalize';

export function mapShiftSummaryToPrintPayload(
  raw: Record<string, unknown>,
  branchName?: string,
): ShiftCloseReportPayload {
  const data = normalizeShiftSummary(raw);
  return buildShiftCloseReportPayload(data, branchName);
}

export function buildShiftCloseReportPayload(
  data: ShiftDetailedSummary,
  branchName?: string,
): ShiftCloseReportPayload {
  const t = data.totals;
  const shift = data.shift;
  const labels = shiftClosePrintLabels;

  const sections: ShiftCloseReportPayload['sections'] = [
    {
      title: labels.openingBalance,
      rows: [{ label: labels.openingBalance, value: money(shift.starting_cash), bold: true }],
    },
    {
      title: labels.revenueSummary,
      rows: [
        { label: labels.grossSales, value: money(t.gross_sales) },
        { label: labels.totalPaid, value: money(t.total_paid) },
        { label: labels.refunds, value: money(t.total_refunds) },
        { label: labels.netRevenue, value: money(t.net_revenue), bold: true },
        { label: labels.cashSales, value: money(t.cash_sales) },
        { label: labels.nonCashSales, value: money(t.non_cash_sales) },
        ...(t.card_payments ? [{ label: 'بطاقات', value: money(t.card_payments) }] : []),
        ...(t.instapay_payments ? [{ label: 'إنستا باي', value: money(t.instapay_payments) }] : []),
        ...(t.electronic_wallet_payments
          ? [{ label: 'محافظ إلكترونية', value: money(t.electronic_wallet_payments) }]
          : []),
        { label: labels.invoiceCount, value: numberText(t.invoice_count) },
      ],
    },
  ];

  if (data.sold_products.length > 0) {
    sections.push({
      title: labels.soldProducts,
      rows: [],
      lineItems: data.sold_products.map((p) => ({
        primary: `${p.product_name} × ${numberText(p.net_quantity)}`,
        secondary: p.category_name ?? undefined,
        amount: money(p.net_amount),
      })),
    });
  }

  if (data.refunds.length > 0) {
    sections.push({
      title: labels.refunds,
      rows: [],
      lineItems: data.refunds.map((r) => ({
        primary: r.invoice_number ? `#${r.invoice_number}` : `#${r.sale_id}`,
        secondary: r.reason ?? undefined,
        amount: money(r.amount),
      })),
    });
  }

  if (data.expenses.length > 0) {
    sections.push({
      title: labels.expenses,
      rows: [{ label: labels.expenses, value: money(t.total_expenses) }],
      lineItems: data.expenses.map((e) => ({
        primary: e.category_name ?? 'مصروف',
        secondary: e.note ?? undefined,
        amount: money(e.amount),
      })),
    });
  }

  if (data.cash_movements.length > 0) {
    sections.push({
      title: labels.cashMovements,
      rows: [
        { label: 'إيداع', value: money(t.cash_deposits) },
        { label: 'سحب', value: money(t.cash_withdrawals) },
      ],
      lineItems: data.cash_movements.map((m) => ({
        primary: m.type,
        secondary: m.note ?? undefined,
        amount: `${m.direction === 'out' ? '-' : ''}${money(m.amount)}`,
      })),
    });
  }

  sections.push({
    title: labels.finalAccounting,
    rows: [
      { label: labels.expectedCash, value: money(t.expected_cash), bold: true },
      { label: labels.actualCash, value: money(t.actual_cash ?? '—') },
      { label: labels.variance, value: money(t.variance ?? 0), bold: true },
    ],
  });

  return {
    branch_name: branchName ?? shift.branch?.name,
    shift_label: shift.shift_no ? `وردية ${shift.shift_no}` : `وردية ${shift.id}`,
    shift_no: shift.shift_no != null ? String(shift.shift_no) : null,
    cashier_name: shift.cashier?.name ?? null,
    vault_name: shift.vault?.name ?? null,
    opened_at: shift.opened_at ? dateText(shift.opened_at) : undefined,
    closed_at: shift.closed_at ? dateText(shift.closed_at) : undefined,
    status: shift.status,
    opening_balance: money(shift.starting_cash),
    sections,
    developer_footer: labels.developerFooter,
  };
}

/** Flatten sections for legacy text ESC/POS fallback. */
export function flattenShiftPayload(payload: ShiftCloseReportPayload): ShiftSummaryPayload {
  const totals = payload.sections.flatMap((section) =>
    section.rows.map((row) => ({ label: row.label, value: row.value })),
  );
  return { ...payload, totals } as unknown as ShiftSummaryPayload;
}
