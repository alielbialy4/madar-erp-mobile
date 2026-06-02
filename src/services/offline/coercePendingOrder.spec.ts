/**
 * Run: npx tsx src/services/offline/coercePendingOrder.spec.ts
 */
import assert from 'node:assert/strict';
import { coercePendingOrderForSync } from './coercePendingOrder';
import type { OfflinePosOrderRecord } from '@/types/offline';

function testDropsEmptyItems() {
  const raw = {
    client_uuid: 'abc',
    branch_id: '1',
    items: [],
    payload: { items: [], payment_type: 'cash' as const, subtotal: 0, total: 0, paid: 0 },
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    local_order_id: 'a',
    client_order_id: 'abc',
    discounts: {},
    payment_lines: null,
    totals_snapshot: { subtotal: 0, discount: 0, tax: 0, total: 0, paid: 0 },
  } satisfies OfflinePosOrderRecord;
  assert.equal(coercePendingOrderForSync(raw), null);
}

function testKeepsValidItems() {
  const raw: OfflinePosOrderRecord = {
    local_order_id: 'loc',
    client_order_id: 'abc',
    client_uuid: 'abc',
    branch_id: '1',
    items: [{ product_id: 1, quantity: 2, unit_price: 10 }],
    payload: {
      items: [{ product_id: 1, quantity: 2, unit_price: 10 }],
      payment_type: 'cash',
      subtotal: 20,
      total: 20,
      paid: 20,
      sale_date: new Date().toISOString(),
    },
    status: 'pending',
    created_at: new Date().toISOString(),
    discounts: {},
    payment_lines: null,
    totals_snapshot: { subtotal: 20, discount: 0, tax: 0, total: 20, paid: 20 },
  };
  const fixed = coercePendingOrderForSync(raw);
  assert.ok(fixed);
  assert.equal(fixed!.items.length, 1);
}

testDropsEmptyItems();
testKeepsValidItems();
console.log('coercePendingOrder.spec.ts: OK');
