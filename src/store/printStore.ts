import { create } from 'zustand';
import type { PrintJobRecord, PrinterProfile } from '@/types/printing';
import type { PrintDiagnosticState } from '@/services/printing/printDiagnostics';
import { countPrintJobs, getPrintJobs } from '@/services/printing/printQueue';
import { getPrinterProfiles } from '@/services/printing/printerProfiles';
import { getPrintDiagnostics } from '@/services/printing/printDiagnostics';

type PrintState = {
  jobs: PrintJobRecord[];
  profiles: PrinterProfile[];
  diagnostics: PrintDiagnosticState;
  pendingCount: number;
  failedCount: number;
  refresh: () => Promise<void>;
  reset: () => void;
};

export const usePrintStore = create<PrintState>((set) => ({
  jobs: [],
  profiles: [],
  diagnostics: {
    last_error: null,
    last_error_at: null,
    last_success_at: null,
    last_profile_id: null,
    last_profile_name: null,
  },
  pendingCount: 0,
  failedCount: 0,
  refresh: async () => {
    const [jobs, profiles, diagnostics] = await Promise.all([
      getPrintJobs(),
      getPrinterProfiles(),
      getPrintDiagnostics(),
    ]);
    const counts = countPrintJobs(jobs);
    set({
      jobs,
      profiles,
      diagnostics,
      pendingCount: counts.pending,
      failedCount: counts.failed,
    });
  },
  reset: () =>
    set({
      jobs: [],
      profiles: [],
      diagnostics: {
        last_error: null,
        last_error_at: null,
        last_success_at: null,
        last_profile_id: null,
        last_profile_name: null,
      },
      pendingCount: 0,
      failedCount: 0,
    }),
}));
