/**
 * Run: npx tsx src/utils/shiftTotalsCanonical.spec.ts
 *
 * Prevents new alias-only consumers: when canonical values exist they must win.
 */
import assert from 'node:assert/strict';
import {
  preferAllocatedCashRefunds,
  preferDrawerCashRefundOutflows,
  preferShiftNetSalesActivity,
  preferShiftTotalRefunds,
  withCanonicalShiftTotals,
} from './shiftTotalsCanonical';

assert.equal(
  preferShiftTotalRefunds({ shift_total_refunds: '100', total_refunds: '999' }),
  '100',
);
assert.equal(preferShiftTotalRefunds({ total_refunds: '40' }), '40');

assert.equal(
  preferAllocatedCashRefunds({ allocated_cash_refunds: '25', cash_method_refunds: '1' }),
  '25',
);
assert.equal(preferAllocatedCashRefunds({ cash_method_refunds: '12' }), '12');

assert.equal(
  preferDrawerCashRefundOutflows({
    drawer_cash_refund_outflows: '70',
    cash_refunds: '1',
  }),
  '70',
);
assert.equal(preferDrawerCashRefundOutflows({ cash_refunds: '9' }), '9');

assert.equal(
  preferShiftNetSalesActivity({ shift_net_sales_activity: '300', net_revenue: '1' }),
  '300',
);
assert.equal(preferShiftNetSalesActivity({ net_revenue: '55' }), '55');

const enriched = withCanonicalShiftTotals({
  shift_total_refunds: '180',
  total_refunds: '999',
  drawer_cash_refund_outflows: '70',
  cash_refunds: '1',
  shift_net_sales_activity: '320',
  net_revenue: '1',
  allocated_cash_refunds: '100',
  cash_method_refunds: '1',
});

assert.equal(enriched.shift_total_refunds, '180');
assert.equal(enriched.drawer_cash_refund_outflows, '70');
assert.equal(enriched.shift_net_sales_activity, '320');
assert.equal(enriched.allocated_cash_refunds, '100');
// Aliases remain for temporary backward compatibility
assert.equal(enriched.total_refunds, '999');
assert.equal(enriched.cash_refunds, '1');

console.log('shiftTotalsCanonical.spec.ts OK');
