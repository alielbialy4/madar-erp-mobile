import type { PrintJobRecord, PrintJobStatus, PrintJobType } from '@/types/printing';
import { storageGet, storageKeys, storageSet } from '@/services/storage';
import { createUuid } from '@/utils/uuid';

export async function getPrintJobs(): Promise<PrintJobRecord[]> {
  return (await storageGet<PrintJobRecord[]>(storageKeys.printJobsQueue)) ?? [];
}

async function persist(jobs: PrintJobRecord[]): Promise<void> {
  await storageSet(storageKeys.printJobsQueue, jobs);
}

export async function enqueuePrintJob(input: {
  type: PrintJobType;
  printer_profile_id: string;
  payload_snapshot: Record<string, unknown>;
  local_order_id?: string | null;
  server_sale_id?: number | null;
}): Promise<PrintJobRecord> {
  const jobs = await getPrintJobs();
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

export async function updatePrintJob(id: string, patch: Partial<PrintJobRecord>): Promise<void> {
  const jobs = await getPrintJobs();
  await persist(jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)));
}

export async function setPrintJobStatus(id: string, status: PrintJobStatus, error?: string | null): Promise<void> {
  const patch: Partial<PrintJobRecord> = { status, error_message: error ?? null };
  if (status === 'printed') patch.printed_at = new Date().toISOString();
  await updatePrintJob(id, patch);
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
  const jobs = await getPrintJobs();
  return jobs.filter((j) => j.status === 'pending');
}
