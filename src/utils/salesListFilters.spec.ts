import assert from 'node:assert/strict';
import {
  EMPTY_SALES_LIST_FILTERS,
  buildSalesListParams,
  countSalesListFilters,
} from './salesListFilters';

assert.deepEqual(buildSalesListParams('', EMPTY_SALES_LIST_FILTERS), {});
assert.deepEqual(
  buildSalesListParams('  INV-1  ', {
    status: 'completed',
    payment_type: 'cash',
    order_type: 'delivery',
    from_date: '2026-01-01',
    to_date: '2026-01-31',
  }),
  {
    search: 'INV-1',
    status: 'completed',
    payment_type: 'cash',
    order_type: 'delivery',
    from_date: '2026-01-01',
    to_date: '2026-01-31',
  },
);
assert.equal(countSalesListFilters(EMPTY_SALES_LIST_FILTERS), 0);
assert.equal(
  countSalesListFilters({ ...EMPTY_SALES_LIST_FILTERS, status: 'refunded', payment_type: 'card' }),
  2,
);

console.log('salesListFilters.spec.ts: OK');
