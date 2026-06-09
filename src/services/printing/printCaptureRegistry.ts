import type { PrintCaptureJob } from '@/types/printing';
import { assertViewShotAvailable } from '@/utils/viewShotAvailability';

export type PrintCaptureFn = (job: PrintCaptureJob) => Promise<string>;

let captureFn: PrintCaptureFn | null = null;

export function registerPrintCapture(fn: PrintCaptureFn | null): void {
  captureFn = fn;
}

/** @deprecated Use registerPrintCapture */
export function registerReceiptCapture(
  fn: ((payload: import('@/types/printing').ReceiptPrintPayload, profile: import('@/types/printing').PrinterProfile) => Promise<string>) | null,
): void {
  if (!fn) {
    registerPrintCapture(null);
    return;
  }
  registerPrintCapture((job) => {
    if (job.kind !== 'receipt') {
      throw new Error('Legacy receipt capture handler supports receipt jobs only');
    }
    return fn(job.payload, job.profile);
  });
}

export async function capturePrintPngBase64(job: PrintCaptureJob): Promise<string> {
  assertViewShotAvailable();
  if (!captureFn) {
    throw new Error('مكوّن التقاط الطباعة غير جاهز — أعد تشغيل التطبيق.');
  }
  return captureFn(job);
}

/** @deprecated Use capturePrintPngBase64 */
export async function captureReceiptPngBase64(
  payload: import('@/types/printing').ReceiptPrintPayload,
  profile: import('@/types/printing').PrinterProfile,
): Promise<string> {
  return capturePrintPngBase64({ kind: 'receipt', payload, profile });
}
