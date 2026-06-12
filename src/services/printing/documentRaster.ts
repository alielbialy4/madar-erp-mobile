import type {
  KitchenTicketPayload,
  PrintCaptureJob,
  PrinterProfile,
  ReceiptPrintPayload,
  ShiftCloseReportPayload,
} from '@/types/printing';
import { ensurePngBase64 } from './captureAssets';
import { capturePrint, type PrintCaptureResult } from './printCaptureRegistry';
import { buildKitchenTicketEscPos } from './kitchenTicketTemplates';
import { buildReceiptEscPos } from './receiptTemplates';
import { buildShiftSummaryEscPos } from './shiftSummaryTemplate';
import { captureAndPrintNative } from './nativeCapturePrint';
import { recordPrintTimingSync } from './printDiagnostics';
import { usesRasterEncoding } from './printPathUtils';

export { usesRasterEncoding };

function buildTextBuffer(job: PrintCaptureJob): Uint8Array {
  recordPrintTimingSync({ print_path: 'fast_text' });
  if (job.kind === 'kitchen') return buildKitchenTicketEscPos(job.payload, job.profile);
  if (job.kind === 'shift') return buildShiftSummaryEscPos(job.payload, job.profile);
  return buildReceiptEscPos(job.payload, job.profile);
}

export async function buildAndMaybeDispatchDocument(
  job: PrintCaptureJob,
): Promise<{ buffer: Uint8Array; alreadySent: boolean }> {
  if (
    usesRasterEncoding(job.profile) &&
    job.profile.connection_type === 'network_tcp' &&
    job.profile.ip?.trim()
  ) {
    const { alreadySent } = await captureAndPrintNative(job);
    return { buffer: new Uint8Array(0), alreadySent };
  }
  if (usesRasterEncoding(job.profile)) {
    return { buffer: new Uint8Array(0), alreadySent: false };
  }
  return { buffer: buildTextBuffer(job), alreadySent: false };
}

export async function buildDocumentBuffer(job: PrintCaptureJob): Promise<Uint8Array> {
  const { buffer } = await buildAndMaybeDispatchDocument(job);
  return buffer;
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
