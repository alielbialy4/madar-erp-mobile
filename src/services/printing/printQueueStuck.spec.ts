import assert from 'node:assert/strict';
import {
  shouldRecoverPrintingJob,
  STALE_PRINTING_JOB_MS,
} from '@/services/printing/printQueueRecovery';
import type { PrintJobRecord } from '@/types/printing';

const now = Date.parse('2026-06-08T12:00:00.000Z');

function job(partial: Partial<PrintJobRecord> & Pick<PrintJobRecord, 'status'>): PrintJobRecord {
  return {
    id: 'j1',
    type: 'receipt',
    printer_profile_id: 'p1',
    payload_snapshot: {},
    attempts: 1,
    created_at: '2026-06-08T11:55:00.000Z',
    ...partial,
  };
}

assert.equal(
  shouldRecoverPrintingJob(
    job({ status: 'printing', printing_at: '2026-06-08T11:57:00.000Z' }),
    now,
    STALE_PRINTING_JOB_MS,
  ),
  true,
);

assert.equal(
  shouldRecoverPrintingJob(
    job({ status: 'printing', printing_at: '2026-06-08T11:59:30.000Z' }),
    now,
    STALE_PRINTING_JOB_MS,
  ),
  false,
);

assert.equal(
  shouldRecoverPrintingJob(job({ status: 'pending' }), now, STALE_PRINTING_JOB_MS),
  false,
);

assert.equal(
  shouldRecoverPrintingJob(
    job({ status: 'printing', printing_at: undefined, created_at: '2026-06-08T11:57:00.000Z' }),
    now,
    STALE_PRINTING_JOB_MS,
  ),
  true,
);

console.log('printQueueStuck.spec: ok');
