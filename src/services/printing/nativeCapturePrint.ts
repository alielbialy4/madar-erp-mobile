import type { PrintCaptureJob, PrinterProfile } from '@/types/printing';
import { capturePrint, type PrintCaptureResult } from './printCaptureRegistry';
import {
  isNativeThermalPrintAvailable,
  printReceiptNativeFromCapture,
  shouldUseNativeThermalPrint,
  warmupNativePrinter,
} from './androidNativeThermalPrinter';
import { recordPrintTimingSync, recordReceiptPrintPathSync } from './printDiagnostics';

export async function warmupForNativePrint(profile: PrinterProfile): Promise<void> {
  if (
    profile.connection_type === 'network_tcp' &&
    profile.ip?.trim() &&
    shouldUseNativeThermalPrint(profile) &&
    (await isNativeThermalPrintAvailable())
  ) {
    await warmupNativePrinter(profile.ip!, profile.port);
  }
}

export async function captureJobWithWarmup(job: PrintCaptureJob): Promise<PrintCaptureResult> {
  await warmupForNativePrint(job.profile);
  return capturePrint(job);
}

export async function tryNativePrintAfterCapture(
  captured: PrintCaptureResult,
  profile: PrinterProfile,
): Promise<boolean> {
  if (!shouldUseNativeThermalPrint(profile)) return false;
  if (!(await isNativeThermalPrintAvailable())) return false;
  if (!captured.pngUri?.trim() && !captured.pngBase64) return false;

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await printReceiptNativeFromCapture(captured, profile);
      recordReceiptPrintPathSync(profile.id, profile.name, 'raster', null);
      recordPrintTimingSync({ native_fallback_reason: null, print_path: 'native_android' });
      return true;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'فشل الطباعة الأصلية';
      if (attempt === 0) continue;
    }
  }

  recordPrintTimingSync({
    native_fallback_reason: lastError ?? 'فشل الطباعة الأصلية',
  });
  return false;
}

export async function captureAndPrintNative(job: PrintCaptureJob): Promise<{ alreadySent: boolean }> {
  try {
    const captured = await captureJobWithWarmup(job);
    const ok = await tryNativePrintAfterCapture(captured, job.profile);
    return { alreadySent: ok };
  } catch (err) {
    recordPrintTimingSync({
      native_fallback_reason: err instanceof Error ? err.message : 'فشل التقاط الصورة',
    });
    return { alreadySent: false };
  }
}
