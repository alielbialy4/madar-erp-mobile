import type { PrintJobRecord } from '@/types/printing';

export const STALE_PRINTING_JOB_MS = 120_000;
export const STALE_PRINTING_JOB_MESSAGE = 'انتهت مهلة الطباعة — أعد المحاولة';

export function shouldRecoverPrintingJob(
  job: PrintJobRecord,
  nowMs: number,
  maxAgeMs: number,
): boolean {
  if (job.status !== 'printing') return false;
  const startedAt = job.printing_at ?? job.created_at;
  const ageMs = nowMs - Date.parse(startedAt);
  return Number.isFinite(ageMs) && ageMs >= maxAgeMs;
}
