import { storageGet, storageKeys, storageSet } from '@/services/storage';
import {
  emptyTiming,
  mergePrintTiming,
  type PrintTimingSnapshot,
  type ReceiptPrintModeDiagnostic,
  type ReceiptPrintPath,
} from './printTimingTypes';
import {
  peekPendingState,
  peekPendingTiming,
  recordCaptureFailureSync,
  recordCaptureSuccessSync,
  recordPrintErrorSync,
  recordPrintSuccessSync,
  recordPrintTimingSync,
  recordReceiptPrintPathSync,
  resetPendingPrintDiagnostics,
} from './printTimingBuffer';

export type { PrintTimingSnapshot, ReceiptPrintPath, ReceiptPrintModeDiagnostic };
export { emptyTiming, mergePrintTiming };
export {
  recordCaptureFailureSync,
  recordCaptureSuccessSync,
  recordPrintErrorSync,
  recordPrintSuccessSync,
  recordPrintTimingSync,
  recordReceiptPrintPathSync,
  resetPendingPrintDiagnostics,
};

export type PrintDiagnosticState = {
  last_error: string | null;
  last_error_at: string | null;
  last_success_at: string | null;
  last_profile_id: string | null;
  last_profile_name: string | null;
  last_print_path: ReceiptPrintPath;
  capture_failed_reason: string | null;
  capture_ok_at: string | null;
  timing: PrintTimingSnapshot;
};

const empty: PrintDiagnosticState = {
  last_error: null,
  last_error_at: null,
  last_success_at: null,
  last_profile_id: null,
  last_profile_name: null,
  last_print_path: null,
  capture_failed_reason: null,
  capture_ok_at: null,
  timing: emptyTiming,
};

let flushScheduled = false;

export async function flushPrintDiagnostics(): Promise<void> {
  const flushStartedAt = Date.now();
  const current = await getPrintDiagnostics();
  const mergedTiming = mergePrintTiming(current.timing, {
    ...peekPendingTiming(),
    diagnostics_flush_ms: Date.now() - flushStartedAt,
  });
  await storageSet(storageKeys.printDiagnostics, {
    ...current,
    ...peekPendingState(),
    timing: mergedTiming,
  });
  resetPendingPrintDiagnostics();
}

/** Schedule a single flush after the current interaction frame (checkout hot path). */
export function scheduleFlushPrintDiagnostics(): void {
  if (flushScheduled) return;
  flushScheduled = true;
  queueMicrotask(() => {
    flushScheduled = false;
    void flushPrintDiagnostics();
  });
}

export async function recordPrintTiming(partial: Partial<PrintTimingSnapshot>): Promise<void> {
  const current = await getPrintDiagnostics();
  await storageSet(storageKeys.printDiagnostics, {
    ...current,
    timing: {
      ...current.timing,
      ...partial,
      measured_at: partial.measured_at ?? new Date().toISOString(),
    },
  });
}

export async function recordCaptureFailure(
  profileId: string,
  profileName: string,
  reason: string,
): Promise<void> {
  recordCaptureFailureSync(profileId, profileName, reason);
  await flushPrintDiagnostics();
}

export async function recordCaptureSuccess(profileId: string, profileName: string): Promise<void> {
  recordCaptureSuccessSync(profileId, profileName);
  await flushPrintDiagnostics();
}

export async function getPrintDiagnostics(): Promise<PrintDiagnosticState> {
  const stored = await storageGet<PrintDiagnosticState>(storageKeys.printDiagnostics);
  const merged = { ...empty, ...(stored ?? {}) };
  return {
    ...merged,
    timing: { ...emptyTiming, ...(stored?.timing ?? {}) },
  };
}

export async function recordReceiptPrintPath(
  profileId: string,
  profileName: string,
  path: ReceiptPrintPath,
  warning?: string | null,
): Promise<void> {
  recordReceiptPrintPathSync(profileId, profileName, path, warning);
  await flushPrintDiagnostics();
}

export async function recordPrintSuccess(profileId: string, profileName: string): Promise<void> {
  recordPrintSuccessSync(profileId, profileName);
  await flushPrintDiagnostics();
}

export async function recordPrintError(profileId: string, profileName: string, message: string): Promise<void> {
  recordPrintErrorSync(profileId, profileName, message);
  await flushPrintDiagnostics();
}

/** @deprecated use recordReceiptPrintPath */
export async function recordRasterFallback(
  profileId: string,
  profileName: string,
  reason: string,
): Promise<void> {
  await recordReceiptPrintPath(profileId, profileName, 'text_cp864_clone', `رجوع لنص CP864: ${reason}`);
}
