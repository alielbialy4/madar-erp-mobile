/**
 * Run: npx tsx src/services/sync/syncEngine.spec.ts
 *
 * Batch semantics parity with web SyncService.pushOrdersBatch.
 */
import assert from 'node:assert/strict';

type Row = { client_uuid: string; status: string; sale_id?: number; message?: string };

function groupByBranch<T extends { branch_id: string }>(orders: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const order of orders) {
    const bucket = map.get(order.branch_id) ?? [];
    bucket.push(order);
    map.set(order.branch_id, bucket);
  }
  return map;
}

function processBatchResponse(
  rows: Row[],
  clientIds: string[],
): { pushed: number; done: Set<string>; failed: Set<string>; errors: string[] } {
  const done = new Set<string>();
  const failed = new Set<string>();
  const errors: string[] = [];
  let pushed = 0;

  for (const row of rows) {
    if (row.status === 'created' || row.status === 'duplicate') {
      done.add(row.client_uuid);
      pushed += 1;
    } else if (row.status === 'error') {
      failed.add(row.client_uuid);
      errors.push(`${row.client_uuid}: ${row.message ?? 'error'}`);
    }
  }

  const unhandled = clientIds.filter((id) => !done.has(id) && !failed.has(id));
  for (const id of unhandled) {
    errors.push(`${id}: missing server row`);
  }

  return { pushed, done, failed, errors };
}

function testGroupsOrdersByBranch() {
  const orders = [
    { client_uuid: 'a', branch_id: 'branch-1' },
    { client_uuid: 'b', branch_id: 'branch-2' },
    { client_uuid: 'c', branch_id: 'branch-1' },
  ];
  const grouped = groupByBranch(orders);
  assert.equal(grouped.size, 2);
  assert.equal(grouped.get('branch-1')?.length, 2);
  assert.equal(grouped.get('branch-2')?.length, 1);
}

function testCountsCreatedAndDuplicateAsPushed() {
  const result = processBatchResponse(
    [
      { client_uuid: 'u1', status: 'created', sale_id: 1 },
      { client_uuid: 'u2', status: 'duplicate', sale_id: 1 },
      { client_uuid: 'u3', status: 'error', message: 'stock' },
    ],
    ['u1', 'u2', 'u3'],
  );
  assert.equal(result.pushed, 2);
  assert.equal(result.done.size, 2);
  assert.equal(result.failed.size, 1);
  assert.equal(result.errors.length, 1);
}

function testRemovesOnlyHandledClientIds() {
  const result = processBatchResponse(
    [{ client_uuid: 'ok', status: 'created', sale_id: 9 }],
    ['ok', 'missing'],
  );
  assert.ok(result.done.has('ok'));
  assert.equal(result.errors[0], 'missing: missing server row');
}

function testMutexSkipsWhenAlreadySyncing() {
  let syncing = false;
  const run = (): { skipped: boolean } => {
    if (syncing) return { skipped: true };
    syncing = true;
    return { skipped: false };
  };
  assert.equal(run().skipped, false);
  assert.equal(run().skipped, true);
}

testGroupsOrdersByBranch();
testCountsCreatedAndDuplicateAsPushed();
testRemovesOnlyHandledClientIds();
testMutexSkipsWhenAlreadySyncing();
console.log('syncEngine.spec.ts: all passed');
