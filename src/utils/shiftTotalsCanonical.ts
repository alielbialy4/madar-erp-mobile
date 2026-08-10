/**
 * Canonical-first accessors for shift summary totals.
 * Prefer canonical fields; fall back to temporary aliases only.
 */
export type ShiftTotalsCanonicalSource = {
  shift_total_refunds?: string | number | null;
  total_refunds?: string | number | null;
  allocated_cash_refunds?: string | number | null;
  cash_method_refunds?: string | number | null;
  drawer_cash_refund_outflows?: string | number | null;
  cash_refunds?: string | number | null;
  shift_net_sales_activity?: string | number | null;
  net_revenue?: string | number | null;
  non_cash_refunds?: string | number | null;
  unallocated_refunds?: string | number | null;
};

function firstDefined(...values: (string | number | null | undefined)[]): string {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') {
      return String(value);
    }
  }
  return '0';
}

export function preferShiftTotalRefunds(t: ShiftTotalsCanonicalSource): string {
  return firstDefined(t.shift_total_refunds, t.total_refunds);
}

export function preferAllocatedCashRefunds(t: ShiftTotalsCanonicalSource): string {
  return firstDefined(t.allocated_cash_refunds, t.cash_method_refunds);
}

export function preferDrawerCashRefundOutflows(t: ShiftTotalsCanonicalSource): string {
  return firstDefined(t.drawer_cash_refund_outflows, t.cash_refunds);
}

export function preferShiftNetSalesActivity(t: ShiftTotalsCanonicalSource): string {
  return firstDefined(t.shift_net_sales_activity, t.net_revenue);
}

/** Enrich API/legacy totals so UI can read canonical keys first. */
export function withCanonicalShiftTotals<T extends ShiftTotalsCanonicalSource>(totals: T): T & {
  shift_total_refunds: string;
  allocated_cash_refunds: string;
  drawer_cash_refund_outflows: string;
  shift_net_sales_activity: string;
  // Keep aliases populated for older renderers during transition.
  total_refunds: string;
  cash_refunds: string;
  cash_method_refunds: string;
  net_revenue: string;
} {
  const shiftTotal = preferShiftTotalRefunds(totals);
  const allocated = preferAllocatedCashRefunds(totals);
  const drawer = preferDrawerCashRefundOutflows(totals);
  const netActivity = preferShiftNetSalesActivity(totals);

  return {
    ...totals,
    shift_total_refunds: shiftTotal,
    total_refunds: firstDefined(totals.total_refunds, shiftTotal),
    allocated_cash_refunds: allocated,
    cash_method_refunds: firstDefined(totals.cash_method_refunds, allocated),
    drawer_cash_refund_outflows: drawer,
    cash_refunds: firstDefined(totals.cash_refunds, drawer),
    shift_net_sales_activity: netActivity,
    net_revenue: firstDefined(totals.net_revenue, netActivity),
  };
}
