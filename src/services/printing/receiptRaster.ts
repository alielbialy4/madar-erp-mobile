import type { PrinterProfile, ReceiptPrintPayload } from '@/types/printing';
import { capturePrint } from './printCaptureRegistry';
import { buildEscPosFromMono, monoHasInk } from './escposRaster';
import { buildArabicTestEscPos, buildReceiptEscPos, buildTestPageEscPos } from './receiptTemplates';
import {
  recordCaptureFailureSync,
  recordPrintTimingSync,
  recordReceiptPrintPathSync,
} from './printDiagnostics';
import { warmupTcpPrinter } from './networkTcpPrinter';
import { pickFallbackStep, TEXT_FALLBACK_STEPS, usesRasterEncoding } from './receiptRasterFallback';

export { pickFallbackStep, TEXT_FALLBACK_STEPS, usesRasterEncoding };

async function captureReceiptWithTcpWarmup(
  payload: ReceiptPrintPayload,
  profile: PrinterProfile,
) {
  const warmup =
    profile.connection_type === 'network_tcp' && profile.ip?.trim()
      ? warmupTcpPrinter(profile.ip, profile.port)
      : Promise.resolve();
  const [captured] = await Promise.all([
    capturePrint({ kind: 'receipt', payload, profile }),
    warmup,
  ]);
  return captured;
}

function tryBuildRasterFromMono(
  captured: Awaited<ReturnType<typeof captureReceiptWithTcpWarmup>>,
  profile: PrinterProfile,
): Uint8Array | null {
  const rasterStart = Date.now();
  if (!monoHasInk(captured.mono)) return null;
  const buffer = buildEscPosFromMono(captured.mono, profile.cut_paper);
  recordPrintTimingSync({ raster_ms: Date.now() - rasterStart });
  return buffer;
}

function buildTextFallback(
  payload: ReceiptPrintPayload,
  profile: PrinterProfile,
  reason: string,
): Uint8Array {
  const step = pickFallbackStep(profile);
  const fallbackProfile: PrinterProfile = {
    ...profile,
    encoding: step.encoding,
    code_page_preset: step.code_page_preset,
    mode: 'escpos_text',
  };
  recordCaptureFailureSync(profile.id, profile.name, reason);
  recordReceiptPrintPathSync(
    profile.id,
    profile.name,
    step.path,
    `رجوع لنص (${step.encoding}): ${reason}`,
  );
  return buildReceiptEscPos(payload, fallbackProfile);
}

async function buildRasterOrFallback(
  payload: ReceiptPrintPayload,
  profile: PrinterProfile,
): Promise<Uint8Array> {
  let captureError = 'فشل التقاط الصورة';
  try {
    const captured = await captureReceiptWithTcpWarmup(payload, profile);
    const raster = tryBuildRasterFromMono(captured, profile);
    if (raster) {
      recordReceiptPrintPathSync(profile.id, profile.name, 'raster', null);
      return raster;
    }
    captureError = 'صورة الإيصال فارغة';
  } catch (err) {
    captureError = err instanceof Error ? err.message : captureError;
  }
  return buildTextFallback(payload, profile, captureError);
}

export async function buildReceiptBuffer(
  payload: ReceiptPrintPayload,
  profile: PrinterProfile,
): Promise<Uint8Array> {
  if (usesRasterEncoding(profile)) {
    return buildRasterOrFallback(payload, profile);
  }
  return buildReceiptEscPos(payload, profile);
}

export async function buildTestPageBuffer(profile: PrinterProfile): Promise<Uint8Array> {
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
    return buildRasterOrFallback(payload, profile);
  }
  return buildTestPageEscPos(profile);
}

export async function buildArabicTestBuffer(profile: PrinterProfile): Promise<Uint8Array> {
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
    return buildRasterOrFallback(payload, profile);
  }
  return buildArabicTestEscPos(profile);
}
