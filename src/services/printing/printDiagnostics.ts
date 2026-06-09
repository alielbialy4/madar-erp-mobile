import { storageGet, storageKeys, storageSet } from '@/services/storage';

export type ReceiptPrintPath =
  | 'raster'
  | 'text_cp864_clone'
  | 'text_windows1256'
  | 'text_cp864_epson'
  | null;

export type PrintDiagnosticState = {
  last_error: string | null;
  last_error_at: string | null;
  last_success_at: string | null;
  last_profile_id: string | null;
  last_profile_name: string | null;
  last_print_path: ReceiptPrintPath;
  capture_failed_reason: string | null;
  capture_ok_at: string | null;
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
};

export async function recordCaptureFailure(
  profileId: string,
  profileName: string,
  reason: string,
): Promise<void> {
  const current = await getPrintDiagnostics();
  await storageSet(storageKeys.printDiagnostics, {
    ...current,
    capture_failed_reason: reason,
    last_profile_id: profileId,
    last_profile_name: profileName,
  });
}

export async function recordCaptureSuccess(profileId: string, profileName: string): Promise<void> {
  const current = await getPrintDiagnostics();
  await storageSet(storageKeys.printDiagnostics, {
    ...current,
    capture_failed_reason: null,
    capture_ok_at: new Date().toISOString(),
    last_profile_id: profileId,
    last_profile_name: profileName,
  });
}

export async function getPrintDiagnostics(): Promise<PrintDiagnosticState> {
  const stored = await storageGet<PrintDiagnosticState>(storageKeys.printDiagnostics);
  return { ...empty, ...stored };
}

export async function recordReceiptPrintPath(
  profileId: string,
  profileName: string,
  path: ReceiptPrintPath,
  warning?: string | null,
): Promise<void> {
  const current = await getPrintDiagnostics();
  await storageSet(storageKeys.printDiagnostics, {
    ...current,
    last_print_path: path,
    last_error: warning ?? null,
    last_error_at: warning ? new Date().toISOString() : current.last_error_at,
    last_profile_id: profileId,
    last_profile_name: profileName,
  });
}

export async function recordPrintSuccess(profileId: string, profileName: string): Promise<void> {
  const current = await getPrintDiagnostics();
  const usedTextFallback = current.last_print_path != null && current.last_print_path !== 'raster';
  await storageSet(storageKeys.printDiagnostics, {
    ...current,
    last_error: usedTextFallback ? current.last_error : null,
    last_error_at: usedTextFallback ? current.last_error_at : null,
    last_success_at: new Date().toISOString(),
    last_profile_id: profileId,
    last_profile_name: profileName,
  });
}

export async function recordPrintError(profileId: string, profileName: string, message: string): Promise<void> {
  const current = await getPrintDiagnostics();
  await storageSet(storageKeys.printDiagnostics, {
    ...current,
    last_error: message,
    last_error_at: new Date().toISOString(),
    last_success_at: null,
    last_profile_id: profileId,
    last_profile_name: profileName,
    last_print_path: null,
  });
}

/** @deprecated use recordReceiptPrintPath */
export async function recordRasterFallback(
  profileId: string,
  profileName: string,
  reason: string,
): Promise<void> {
  await recordReceiptPrintPath(profileId, profileName, 'text_cp864_clone', `رجوع لنص CP864: ${reason}`);
}
