import type { PrinterProfile, ReceiptPrintPayload } from '@/types/printing';
import { captureReceiptPngBase64 } from './printCaptureRegistry';
import { buildEscPosFromPngBase64, rasterHasInk } from './escposRaster';
import { buildArabicTestEscPos, buildReceiptEscPos, buildTestPageEscPos } from './receiptTemplates';
import { recordCaptureFailure, recordReceiptPrintPath } from './printDiagnostics';
import { pickFallbackStep, TEXT_FALLBACK_STEPS, usesRasterEncoding } from './receiptRasterFallback';

export { pickFallbackStep, TEXT_FALLBACK_STEPS, usesRasterEncoding };

async function tryBuildRaster(
  base64: string,
  profile: PrinterProfile,
): Promise<Uint8Array | null> {
  if (!rasterHasInk(base64, profile.paper_width)) return null;
  return buildEscPosFromPngBase64(base64, profile.paper_width, profile.cut_paper);
}

async function buildTextFallback(
  payload: ReceiptPrintPayload,
  profile: PrinterProfile,
  reason: string,
): Promise<Uint8Array> {
  const step = pickFallbackStep(profile);
  const fallbackProfile: PrinterProfile = {
    ...profile,
    encoding: step.encoding,
    code_page_preset: step.code_page_preset,
    mode: 'escpos_text',
  };
  await recordCaptureFailure(profile.id, profile.name, reason);
  await recordReceiptPrintPath(
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
    const base64 = await captureReceiptPngBase64(payload, profile);
    const raster = await tryBuildRaster(base64, profile);
    if (raster) {
      await recordReceiptPrintPath(profile.id, profile.name, 'raster', null);
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
