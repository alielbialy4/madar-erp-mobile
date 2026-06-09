import type { PrintJobRecord, PrintJobStatus, PrintJobType } from '@/types/printing';
import { storageGetArray, storageKeys, storageSet } from '@/services/storage';
import { createUuid } from '@/utils/uuid';
import {
  shouldRecoverPrintingJob,
  STALE_PRINTING_JOB_MS,
  STALE_PRINTING_JOB_MESSAGE,
} from '@/services/printing/printQueueRecovery';

export { shouldRecoverPrintingJob, STALE_PRINTING_JOB_MS, STALE_PRINTING_JOB_MESSAGE };

function isPrintJobRecord(item: unknown): item is PrintJobRecord {
  return (
    item != null &&
    typeof item === 'object' &&
    typeof (item as PrintJobRecord).id === 'string' &&
    typeof (item as PrintJobRecord).status === 'string'
  );
}

let jobsCache: PrintJobRecord[] | null = null;
let jobsCacheLoaded = false;

async function ensureJobsLoaded(): Promise<PrintJobRecord[]> {
  if (!jobsCacheLoaded) {
    jobsCache = await storageGetArray(storageKeys.printJobsQueue, isPrintJobRecord);
    jobsCacheLoaded = true;
  }
  return jobsCache ?? [];
}

export function invalidatePrintJobsCache(): void {
  jobsCache = null;
  jobsCacheLoaded = false;
}

export async function getPrintJobs(): Promise<PrintJobRecord[]> {
  return [...(await ensureJobsLoaded())];
}

async function persist(jobs: PrintJobRecord[]): Promise<void> {
  jobsCache = jobs;
  jobsCacheLoaded = true;
  await storageSet(storageKeys.printJobsQueue, jobs);
}

export async function enqueuePrintJob(input: {
  type: PrintJobType;
  printer_profile_id: string;
  payload_snapshot: Record<string, unknown>;
  local_order_id?: string | null;
  server_sale_id?: number | null;
}): Promise<PrintJobRecord> {
  const jobs = await ensureJobsLoaded();
  const job: PrintJobRecord = {
    id: createUuid(),
    local_order_id: input.local_order_id ?? null,
    server_sale_id: input.server_sale_id ?? null,
    type: input.type,
    printer_profile_id: input.printer_profile_id,
    payload_snapshot: input.payload_snapshot,
    status: 'pending',
    attempts: 0,
    created_at: new Date().toISOString(),
  };
  await persist([job, ...jobs].slice(0, 500));
  return job;
}

export async function updatePrintJob(id: string, patch: Partial<PrintJobRecord>): Promise<PrintJobRecord | null> {
  const jobs = await ensureJobsLoaded();
  let updated: PrintJobRecord | null = null;
  const next = jobs.map((j) => {
    if (j.id !== id) return j;
    updated = { ...j, ...patch };
    return updated;
  });
  await persist(next);
  return updated;
}

export async function setPrintJobStatus(id: string, status: PrintJobStatus, error?: string | null): Promise<PrintJobRecord | null> {
  const patch: Partial<PrintJobRecord> = { status, error_message: error ?? null };
  if (status === 'printed') patch.printed_at = new Date().toISOString();
  if (status === 'printing') patch.printing_at = new Date().toISOString();
  return updatePrintJob(id, patch);
}

export async function retryPrintJob(id: string): Promise<void> {
  await updatePrintJob(id, { status: 'pending', error_message: null });
}

export async function cancelPrintJob(id: string): Promise<void> {
  await updatePrintJob(id, { status: 'cancelled' });
}

export function countPrintJobs(jobs: PrintJobRecord[]) {
  return {
    pending: jobs.filter((j) => j.status === 'pending' || j.status === 'printing').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
    printed: jobs.filter((j) => j.status === 'printed').length,
  };
}

export async function getPendingPrintJobs(): Promise<PrintJobRecord[]> {
  const jobs = await ensureJobsLoaded();
  return jobs.filter((j) => j.status === 'pending');
}

/** Mark jobs stuck in `printing` as failed so the queue can recover. */
export async function recoverStalePrintJobs(maxAgeMs = STALE_PRINTING_JOB_MS): Promise<number> {
  const jobs = await ensureJobsLoaded();
  const now = Date.now();
  let recovered = 0;
  const next = jobs.map((job) => {
    if (!isPrintJobRecord(job) || !shouldRecoverPrintingJob(job, now, maxAgeMs)) return job;
    recovered += 1;
    return {
      ...job,
      status: 'failed' as PrintJobStatus,
      error_message: STALE_PRINTING_JOB_MESSAGE,
    };
  });
  if (recovered > 0) await persist(next);
  return recovered;
}
