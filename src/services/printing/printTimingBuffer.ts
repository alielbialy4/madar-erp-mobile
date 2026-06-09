import type { PrintTimingSnapshot, ReceiptPrintPath } from './printTimingTypes';

export type { PrintTimingSnapshot, ReceiptPrintPath };

type PendingStatePatch = {
  last_error?: string | null;
  last_error_at?: string | null;
  last_success_at?: string | null;
  last_profile_id?: string | null;
  last_profile_name?: string | null;
  last_print_path?: ReceiptPrintPath;
  capture_failed_reason?: string | null;
  capture_ok_at?: string | null;
};

let pendingTiming: Partial<PrintTimingSnapshot> = {};
let pendingState: PendingStatePatch = {};

export function resetPendingPrintDiagnostics(): void {
  pendingTiming = {};
  pendingState = {};
}

export function peekPendingTiming(): Partial<PrintTimingSnapshot> {
  return { ...pendingTiming };
}

export function peekPendingState(): PendingStatePatch {
  return { ...pendingState };
}

export function recordPrintTimingSync(partial: Partial<PrintTimingSnapshot>): void {
  Object.assign(pendingTiming, partial, {
    measured_at: partial.measured_at ?? new Date().toISOString(),
  });
}

export function recordCaptureSuccessSync(profileId: string, profileName: string): void {
  Object.assign(pendingState, {
    capture_failed_reason: null,
    capture_ok_at: new Date().toISOString(),
    last_profile_id: profileId,
    last_profile_name: profileName,
  });
}

export function recordCaptureFailureSync(profileId: string, profileName: string, reason: string): void {
  Object.assign(pendingState, {
    capture_failed_reason: reason,
    last_profile_id: profileId,
    last_profile_name: profileName,
  });
}

export function recordReceiptPrintPathSync(
  profileId: string,
  profileName: string,
  path: ReceiptPrintPath,
  warning?: string | null,
): void {
  Object.assign(pendingState, {
    last_print_path: path,
    last_error: warning ?? null,
    last_error_at: warning ? new Date().toISOString() : pendingState.last_error_at,
    last_profile_id: profileId,
    last_profile_name: profileName,
  });
}

export function recordPrintSuccessSync(profileId: string, profileName: string): void {
  const usedTextFallback =
    pendingState.last_print_path != null && pendingState.last_print_path !== 'raster';
  Object.assign(pendingState, {
    last_error: usedTextFallback ? pendingState.last_error : null,
    last_error_at: usedTextFallback ? pendingState.last_error_at : null,
    last_success_at: new Date().toISOString(),
    last_profile_id: profileId,
    last_profile_name: profileName,
  });
}

export function recordPrintErrorSync(profileId: string, profileName: string, message: string): void {
  Object.assign(pendingState, {
    last_error: message,
    last_error_at: new Date().toISOString(),
    last_success_at: null,
    last_profile_id: profileId,
    last_profile_name: profileName,
    last_print_path: null,
  });
}
