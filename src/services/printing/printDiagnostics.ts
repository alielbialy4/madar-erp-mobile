import { storageGet, storageKeys, storageSet } from '@/services/storage';

export type PrintDiagnosticState = {
  last_error: string | null;
  last_error_at: string | null;
  last_success_at: string | null;
  last_profile_id: string | null;
  last_profile_name: string | null;
};

const empty: PrintDiagnosticState = {
  last_error: null,
  last_error_at: null,
  last_success_at: null,
  last_profile_id: null,
  last_profile_name: null,
};

export async function getPrintDiagnostics(): Promise<PrintDiagnosticState> {
  return (await storageGet<PrintDiagnosticState>(storageKeys.printDiagnostics)) ?? empty;
}

export async function recordPrintSuccess(profileId: string, profileName: string): Promise<void> {
  await storageSet(storageKeys.printDiagnostics, {
    last_error: null,
    last_error_at: null,
    last_success_at: new Date().toISOString(),
    last_profile_id: profileId,
    last_profile_name: profileName,
  });
}

export async function recordPrintError(profileId: string, profileName: string, message: string): Promise<void> {
  await storageSet(storageKeys.printDiagnostics, {
    last_error: message,
    last_error_at: new Date().toISOString(),
    last_success_at: null,
    last_profile_id: profileId,
    last_profile_name: profileName,
  });
}
