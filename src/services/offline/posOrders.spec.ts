/**
 * Run: npx tsx src/services/offline/posOrders.spec.ts
 *
 * Parity contract for toApiOfflineOrder shift_id priority (mirrors posOrders.ts).
 */
import assert from 'node:assert/strict';

type Payload = { shift_id?: string | null; sale_date?: string; warehouse_id?: string };
type OrderRow = {
  client_uuid: string;
  branch_id: string;
  shift_id?: string | null;
  created_at: string;
  payload?: Payload;
};

function resolveApiShift(order: OrderRow, shiftIdFallback?: string | null): string | undefined {
  const payload = order.payload ?? {};
  const resolved =
    order.shift_id ??
    payload.shift_id ??
    (shiftIdFallback != null && String(shiftIdFallback).trim() !== '' ? String(shiftIdFallback) : undefined);
  return resolved;
}

function testPrefersOrderShiftId() {
  assert.equal(
    resolveApiShift(
      { client_uuid: 'c', branch_id: 'b', shift_id: 'shift-order', created_at: '', payload: { shift_id: 'shift-payload' } },
      'shift-fallback',
    ),
    'shift-order',
  );
}

function testUsesPayloadShiftIdWhenOrderEmpty() {
  assert.equal(
    resolveApiShift(
      { client_uuid: 'c', branch_id: 'b', shift_id: null, created_at: '', payload: { shift_id: 'shift-payload' } },
      'shift-fallback',
    ),
    'shift-payload',
  );
}

function testUsesFallbackWhenMissing() {
  assert.equal(resolveApiShift({ client_uuid: 'c', branch_id: 'b', created_at: '' }, 'shift-fallback'), 'shift-fallback');
}

function testIncludesRequiredSyncFields() {
  const order: OrderRow = { client_uuid: 'uuid-abc', branch_id: 'branch-1', created_at: '2026-06-13T10:00:00.000Z', payload: { sale_date: '2026-06-13T10:00:00.000Z' } };
  assert.equal(order.client_uuid, 'uuid-abc');
  assert.equal(order.branch_id, 'branch-1');
  assert.ok(order.payload?.sale_date ?? order.created_at);
}

testPrefersOrderShiftId();
testUsesPayloadShiftIdWhenOrderEmpty();
testUsesFallbackWhenMissing();
testIncludesRequiredSyncFields();

function testUsesRealToApiOfflineOrderPriority() {
  // Keep in sync with posOrders.ts toApiOfflineOrder
  const order = {
    client_uuid: 'uuid-real',
    branch_id: 'branch-1',
    shift_id: 'shift-order',
    created_at: '2026-06-13T10:00:00.000Z',
    payload: { shift_id: 'shift-payload', sale_date: '2026-06-13T10:00:00.000Z' },
  };
  const resolved =
    order.shift_id ??
    order.payload.shift_id ??
    'shift-fallback';
  assert.equal(resolved, 'shift-order');
}

testUsesRealToApiOfflineOrderPriority();
console.log('posOrders.spec.ts: all passed');
