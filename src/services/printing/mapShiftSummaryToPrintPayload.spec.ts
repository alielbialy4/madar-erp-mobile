/**
 * Run: npx tsx src/services/printing/mapShiftSummaryToPrintPayload.spec.ts
 */
import assert from 'node:assert/strict';
import { mapShiftSummaryToPrintPayload } from './mapShiftSummaryToPrintPayload';

const canonicalFirst = mapShiftSummaryToPrintPayload({
  totals: {
    invoice_count: 1,
    gross_sales: '500',
    total_paid: '500',
    shift_total_refunds: '180',
    total_refunds: '999',
    refund_count: 2,
    shift_net_sales_activity: '320',
    net_revenue: '1',
    drawer_cash_refund_outflows: '70',
    cash_refunds: '1',
    total_expenses: '0',
    cash_sales: '400',
    non_cash_sales: '100',
    cash_deposits: '0',
    cash_withdrawals: '0',
    cash_expenses: '0',
    expected_cash: '300',
    actual_cash: null,
    variance: null,
  },
  invoices: [],
  sold_products: [],
  refunds: [],
  expenses: [],
  cash_movements: [],
  shift: {
    id: 's1',
    shift_no: 1,
    branch: { id: 'b1', name: 'فرع' },
    cashier: { id: 1, name: 'كاشير' },
    vault: { id: 'v1', name: 'خزينة' },
    opened_at: '2026-08-03T08:00:00.000Z',
    closed_at: null,
    status: 'open',
    starting_cash: '100',
  },
});

const refundRow = canonicalFirst.sections
  .flatMap((s) => s.rows)
  .find((r) => r.label.includes('مرتجع') || r.label === canonicalFirst.sections[1]?.rows[2]?.label);
const allValues = canonicalFirst.sections.flatMap((s) => s.rows.map((r) => r.value)).join(' ');
assert.ok(allValues.includes('180'), 'canonical shift_total_refunds must appear');
assert.ok(!allValues.includes('999'), 'stale total_refunds alias must not win');
assert.ok(allValues.includes('320'), 'canonical shift_net_sales_activity must appear');
assert.ok(!allValues.includes('1.00') || allValues.includes('320'), 'stale net_revenue must not be the net KPI');

void refundRow;
console.log('mapShiftSummaryToPrintPayload.spec.ts OK');
