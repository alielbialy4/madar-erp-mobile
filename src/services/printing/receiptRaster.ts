import type { PrinterProfile, ReceiptPrintPayload } from '@/types/printing';
import { buildArabicTestEscPos, buildReceiptEscPos, buildTestPageEscPos } from './receiptTemplates';
import { captureAndPrintNative, captureJobWithWarmup, tryNativePrintAfterCapture } from './nativeCapturePrint';
import { recordPrintTimingSync } from './printDiagnostics';
import { sendEscPosOverTcp } from './networkTcpPrinter';
import { usesRasterEncoding } from './printPathUtils';

export { usesRasterEncoding };

type RasterBuildResult = { buffer: Uint8Array; alreadySent: boolean };

async function buildNativeRasterReceipt(
  payload: ReceiptPrintPayload,
  profile: PrinterProfile,
): Promise<RasterBuildResult> {
  const { alreadySent } = await captureAndPrintNative({ kind: 'receipt', payload, profile });
  return { buffer: new Uint8Array(0), alreadySent };
}

export async function buildReceiptBuffer(
  payload: ReceiptPrintPayload,
  profile: PrinterProfile,
): Promise<Uint8Array> {
  if (usesRasterEncoding(profile)) {
    const { buffer } = await buildNativeRasterReceipt(payload, profile);
    return buffer;
  }
  recordPrintTimingSync({ print_path: 'fast_text' });
  return buildReceiptEscPos(payload, profile);
}

export async function buildAndMaybeDispatchReceipt(
  payload: ReceiptPrintPayload,
  profile: PrinterProfile,
): Promise<{ buffer: Uint8Array; alreadySent: boolean }> {
  if (!usesRasterEncoding(profile)) {
    recordPrintTimingSync({ print_path: 'fast_text' });
    return { buffer: buildReceiptEscPos(payload, profile), alreadySent: false };
  }
  return buildNativeRasterReceipt(payload, profile);
}

export async function dispatchReceiptBuffer(
  profile: PrinterProfile,
  buffer: Uint8Array,
  alreadySent: boolean,
): Promise<void> {
  if (alreadySent || buffer.length === 0) return;
  await sendEscPosOverTcp(profile.ip ?? '', profile.port, buffer);
}

export async function buildTestPageBuffer(profile: PrinterProfile): Promise<RasterBuildResult> {
  if (usesRasterEncoding(profile)) {
    const payload: ReceiptPrintPayload = {
      date: new Date().toLocaleString('ar-EG-u-nu-latn'),
      items: [{ name: 'اختبار الطباعة', quantity: 1, unit_price: 0 }],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      paid: 0,
      payment_type: 'test',
      branch_name: 'MADAR POS TEST',
    };
    return buildNativeRasterReceipt(payload, profile);
  }
  recordPrintTimingSync({ print_path: 'fast_text' });
  return { buffer: buildTestPageEscPos(profile), alreadySent: false };
}

export async function buildArabicTestBuffer(profile: PrinterProfile): Promise<RasterBuildResult> {
  if (usesRasterEncoding(profile)) {
    const payload: ReceiptPrintPayload = {
      date: new Date().toLocaleString('ar-EG-u-nu-latn'),
      items: [
        { name: 'منتج تجريبي', quantity: 1, unit_price: 123.45 },
        { name: 'اختبار الطباعة العربية', quantity: 2, unit_price: 10 },
      ],
      subtotal: 143.45,
      discount: 0,
      tax: 0,
      total: 143.45,
      paid: 143.45,
      payment_type: 'test',
      branch_name: 'اختبار عربي',
    };
    return buildNativeRasterReceipt(payload, profile);
  }
  recordPrintTimingSync({ print_path: 'fast_text' });
  return { buffer: buildArabicTestEscPos(profile), alreadySent: false };
}

/** @internal exported for tests */
export { captureJobWithWarmup, tryNativePrintAfterCapture };
