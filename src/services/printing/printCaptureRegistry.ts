import type { PrintCaptureJob } from '@/types/printing';
import { assertViewShotAvailable } from '@/utils/viewShotAvailability';
import type { MonoRaster } from './escposRaster';

export type PrintCaptureResult = {
  pngBase64: string;
  mono: MonoRaster;
};

export type PrintCaptureFn = (job: PrintCaptureJob) => Promise<PrintCaptureResult>;

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
  registerPrintCapture(async (job) => {
    if (job.kind !== 'receipt') {
      throw new Error('Legacy receipt capture handler supports receipt jobs only');
    }
    const pngBase64 = await fn(job.payload, job.profile);
    return { pngBase64, mono: { width: 0, height: 0, data: new Uint8Array(0) } };
  });
}

export async function capturePrint(job: PrintCaptureJob): Promise<PrintCaptureResult> {
  assertViewShotAvailable();
  if (!captureFn) {
    throw new Error('مكوّن التقاط الطباعة غير جاهز — أعد تشغيل التطبيق.');
  }
  return captureFn(job);
}

export async function capturePrintPngBase64(job: PrintCaptureJob): Promise<string> {
  const result = await capturePrint(job);
  return result.pngBase64;
}

/** @deprecated Use capturePrint */
export async function captureReceiptPngBase64(
  payload: import('@/types/printing').ReceiptPrintPayload,
  profile: import('@/types/printing').PrinterProfile,
): Promise<string> {
  return capturePrintPngBase64({ kind: 'receipt', payload, profile });
}
