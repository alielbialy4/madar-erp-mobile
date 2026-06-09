import type {
  KitchenTicketPayload,
  PrintCaptureJob,
  PrinterProfile,
  ReceiptPrintPayload,
  ShiftCloseReportPayload,
} from '@/types/printing';
import { capturePrintPngBase64 } from './printCaptureRegistry';
import { buildEscPosFromPngBase64, rasterHasInk } from './escposRaster';
import { buildKitchenTicketEscPos } from './kitchenTicketTemplates';
import { buildReceiptEscPos } from './receiptTemplates';
import { buildShiftSummaryEscPos } from './shiftSummaryTemplate';
import { recordCaptureFailure, recordReceiptPrintPath } from './printDiagnostics';
import { pickFallbackStep, usesRasterEncoding } from './receiptRasterFallback';

export { usesRasterEncoding };

async function tryBuildRaster(base64: string, profile: PrinterProfile): Promise<Uint8Array | null> {
  if (!rasterHasInk(base64, profile.paper_width)) return null;
  return buildEscPosFromPngBase64(base64, profile.paper_width, profile.cut_paper);
}

async function buildRasterBuffer(job: PrintCaptureJob): Promise<Uint8Array> {
  let captureError = 'فشل التقاط الصورة';
  try {
    const base64 = await capturePrintPngBase64(job);
    const raster = await tryBuildRaster(base64, job.profile);
    if (raster) {
      await recordReceiptPrintPath(job.profile.id, job.profile.name, 'raster', null);
      return raster;
    }
    captureError = 'صورة الطباعة فارغة';
  } catch (err) {
    captureError = err instanceof Error ? err.message : captureError;
  }

  await recordCaptureFailure(job.profile.id, job.profile.name, captureError);
  const step = pickFallbackStep(job.profile);
  const fallbackProfile: PrinterProfile = {
    ...job.profile,
    encoding: step.encoding,
    code_page_preset: step.code_page_preset,
    mode: 'escpos_text',
  };
  await recordReceiptPrintPath(
    job.profile.id,
    job.profile.name,
    step.path,
    `رجوع لنص (${step.encoding}): ${captureError}`,
  );

  if (job.kind === 'kitchen') {
    return buildKitchenTicketEscPos(job.payload, fallbackProfile);
  }
  if (job.kind === 'shift') {
    return buildShiftSummaryEscPos(job.payload, fallbackProfile);
  }
  return buildReceiptEscPos(job.payload, fallbackProfile);
}

export async function buildDocumentBuffer(job: PrintCaptureJob): Promise<Uint8Array> {
  if (usesRasterEncoding(job.profile)) {
    return buildRasterBuffer(job);
  }
  if (job.kind === 'kitchen') return buildKitchenTicketEscPos(job.payload, job.profile);
  if (job.kind === 'shift') return buildShiftSummaryEscPos(job.payload, job.profile);
  return buildReceiptEscPos(job.payload, job.profile);
}

export async function buildReceiptBuffer(
  payload: ReceiptPrintPayload,
  profile: PrinterProfile,
): Promise<Uint8Array> {
  return buildDocumentBuffer({ kind: 'receipt', payload, profile });
}

export async function buildKitchenBuffer(
  payload: KitchenTicketPayload,
  profile: PrinterProfile,
): Promise<Uint8Array> {
  return buildDocumentBuffer({ kind: 'kitchen', payload, profile });
}

export async function buildShiftBuffer(
  payload: ShiftCloseReportPayload,
  profile: PrinterProfile,
): Promise<Uint8Array> {
  return buildDocumentBuffer({ kind: 'shift', payload, profile });
}

export async function captureDocumentPngBase64(job: PrintCaptureJob): Promise<string> {
  return capturePrintPngBase64(job);
}
