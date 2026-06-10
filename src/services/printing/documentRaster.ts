import type {
  KitchenTicketPayload,
  PrintCaptureJob,
  PrinterProfile,
  ReceiptPrintPayload,
  ShiftCloseReportPayload,
} from '@/types/printing';
import { ensureCaptureMono, ensurePngBase64 } from './captureAssets';
import { capturePrint, type PrintCaptureResult } from './printCaptureRegistry';
import { buildEscPosFromMono, monoHasInk } from './escposRaster';
import { buildKitchenTicketEscPos } from './kitchenTicketTemplates';
import { buildReceiptEscPos } from './receiptTemplates';
import { buildShiftSummaryEscPos } from './shiftSummaryTemplate';
import {
  recordCaptureFailureSync,
  recordPrintTimingSync,
  recordReceiptPrintPathSync,
} from './printDiagnostics';
import { warmupTcpPrinter } from './networkTcpPrinter';
import { pickFallbackStep, usesRasterEncoding } from './receiptRasterFallback';

export { usesRasterEncoding };

async function tryBuildRasterFromMono(
  captured: PrintCaptureResult,
  profile: PrinterProfile,
): Promise<Uint8Array | null> {
  const rasterStart = Date.now();
  const mono = await ensureCaptureMono(captured, profile.paper_width);
  if (!monoHasInk(mono)) return null;
  const buffer = buildEscPosFromMono(mono, profile.cut_paper);
  recordPrintTimingSync({ raster_ms: Date.now() - rasterStart });
  return buffer;
}

async function buildRasterBuffer(job: PrintCaptureJob): Promise<Uint8Array> {
  let captureError = 'فشل التقاط الصورة';
  try {
    const warmup =
      job.profile.connection_type === 'network_tcp' && job.profile.ip?.trim()
        ? warmupTcpPrinter(job.profile.ip, job.profile.port)
        : Promise.resolve();
    const [captured] = await Promise.all([capturePrint(job), warmup]);
    const raster = await tryBuildRasterFromMono(captured, job.profile);
    if (raster) {
      recordReceiptPrintPathSync(job.profile.id, job.profile.name, 'raster', null);
      return raster;
    }
    captureError = 'صورة الطباعة فارغة';
  } catch (err) {
    captureError = err instanceof Error ? err.message : captureError;
  }

  recordCaptureFailureSync(job.profile.id, job.profile.name, captureError);
  const step = pickFallbackStep(job.profile);
  const fallbackProfile: PrinterProfile = {
    ...job.profile,
    encoding: step.encoding,
    code_page_preset: step.code_page_preset,
    mode: 'escpos_text',
  };
  recordReceiptPrintPathSync(
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

export async function captureDocument(job: PrintCaptureJob): Promise<PrintCaptureResult> {
  return capturePrint(job);
}

/** @deprecated Use captureDocument */
export async function captureDocumentPngBase64(job: PrintCaptureJob): Promise<string> {
  const result = await captureDocument(job);
  return ensurePngBase64(result);
}
