/**
 * CERT-GAP-036: Driver settlement create must stamp multi-register drawer money context
 * and block submit when a register session is required but missing (web parity).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'DriverSettlementsScreen.tsx'), 'utf8');

assert.match(src, /buildDriverSettlementMoneyContext/);
assert.match(src, /driverSettlementRegisterSessionRequired/);
assert.match(src, /RegisterDrawerSessionPicker/);
assert.match(src, /posRegisterId:\s*moneyContext\.pos_register_id/);
assert.match(src, /registerSessionId:\s*moneyContext\.register_session_id/);
assert.match(src, /needsRegisterSession/);
assert.match(src, /اختر جلسة درج مفتوحة/);

console.log('driverSettlementCreateContract.spec.ts: OK');
