/**
 * Run: npx tsx src/services/printing/printDiagnostics.spec.ts
 */
import assert from 'node:assert/strict';
import { emptyTiming, mergePrintTiming } from './printTimingTypes';
import { recordPrintTimingSync, resetPendingPrintDiagnostics } from './printTimingBuffer';

function testMergePrintTimingPreservesCurrent() {
  const current = { ...emptyTiming, capture_total_ms: 500, view_shot_ms: 2000 };
  const merged = mergePrintTiming(current, { png_decode_ms: 80, mono_convert_ms: 120 });
  assert.equal(merged.capture_total_ms, 500);
  assert.equal(merged.view_shot_ms, 2000);
  assert.equal(merged.png_decode_ms, 80);
  assert.equal(merged.mono_convert_ms, 120);
  assert.ok(merged.measured_at);
}

function testMergePrintTimingPendingOverrides() {
  const current = { ...emptyTiming, tcp_connect_ms: 100 };
  const merged = mergePrintTiming(current, { tcp_connect_ms: 50, tcp_write_ms: 200 });
  assert.equal(merged.tcp_connect_ms, 50);
  assert.equal(merged.tcp_write_ms, 200);
}

function testRecordPrintTimingSyncAccumulates() {
  resetPendingPrintDiagnostics();
  recordPrintTimingSync({ capture_gates_ms: 120 });
  recordPrintTimingSync({ view_shot_ms: 3000 });
  recordPrintTimingSync({ total_print_ms: 4500 });
  const merged = mergePrintTiming(emptyTiming, {
    capture_gates_ms: 120,
    view_shot_ms: 3000,
    total_print_ms: 4500,
  });
  assert.equal(merged.capture_gates_ms, 120);
  assert.equal(merged.view_shot_ms, 3000);
  assert.equal(merged.total_print_ms, 4500);
}

testMergePrintTimingPreservesCurrent();
testMergePrintTimingPendingOverrides();
testRecordPrintTimingSyncAccumulates();

console.log('printDiagnostics.spec.ts: OK');
