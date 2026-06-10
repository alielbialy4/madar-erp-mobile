import type { PrinterProfile, ReceiptPrintPayload } from '@/types/printing';
import { ensureCaptureMono } from './captureAssets';
import { capturePrint, type PrintCaptureResult } from './printCaptureRegistry';
import { buildEscPosFromMono, monoHasInk } from './escposRaster';
import { buildEscPosStripJob, STRIP_HEIGHT_PX } from './escposStripRaster';
import { buildArabicTestEscPos, buildReceiptEscPos, buildTestPageEscPos } from './receiptTemplates';
import {
  effectiveReceiptProfile,
  TEMP_FORCE_FAST_TEXT,
} from './resolvePrintPath';
import {
  isNativeThermalPrintAvailable,
  printReceiptNativeFromCapture,
  shouldUseNativeThermalPrint,
  warmupNativePrinter,
} from './androidNativeThermalPrinter';
import {
  recordCaptureFailureSync,
  recordPrintTimingSync,
  recordReceiptPrintPathSync,
} from './printDiagnostics';
import { sendEscPosOverTcp } from './networkTcpPrinter';
import { warmupTcpPrinter } from './networkTcpPrinter';
import { sendEscPosStripsOverTcp } from './tcpStripStreamer';
import { pickFallbackStep, TEXT_FALLBACK_STEPS, usesRasterEncoding } from './receiptRasterFallback';

export { pickFallbackStep, TEXT_FALLBACK_STEPS, usesRasterEncoding };

/**
 * TEMP: force JS strip (GS v0) only — disables Kotlin native, single JS buffer, and text fallbacks.
 * Set to false after device strip benchmarking.
 */
export const TEMP_FORCE_JS_STRIP_ONLY = false;

/** Aggressive strip tuning while TEMP_FORCE_JS_STRIP_ONLY — fewer strips, no inter-delay. */
const STRIP_TEST_HEIGHT_PX = 96;
const STRIP_TEST_INTER_DELAY_MS = 0;
const STRIP_TEST_SETTLE_MS = 40;

type RasterBuildResult = { buffer: Uint8Array; alreadySent: boolean };

function rasterProfileForStripTest(profile: PrinterProfile): PrinterProfile {
  if (usesRasterEncoding(profile)) return profile;
  return { ...profile, encoding: 'utf8_image', mode: 'escpos_image' };
}

export function assertJsStripTestProfile(profile: PrinterProfile): void {
  if (profile.connection_type !== 'network_tcp' || !profile.ip?.trim()) {
    throw new Error('وضع اختبار JS strip: الطابعة يجب أن تكون TCP مع عنوان IP.');
  }
}

async function captureReceiptWithTcpWarmup(
  payload: ReceiptPrintPayload,
  profile: PrinterProfile,
) {
  const useNativeWarmup =
    profile.connection_type === 'network_tcp' &&
    profile.ip?.trim() &&
    shouldUseNativeThermalPrint(profile) &&
    (await isNativeThermalPrintAvailable());

  const warmup = useNativeWarmup
    ? warmupNativePrinter(profile.ip!, profile.port)
    : profile.connection_type === 'network_tcp' && profile.ip?.trim()
      ? warmupTcpPrinter(profile.ip, profile.port)
      : Promise.resolve();

  await warmup;
  const captured = await capturePrint({ kind: 'receipt', payload, profile });
  return captured;
}

function tryBuildRasterFromMono(
  mono: Awaited<ReturnType<typeof ensureCaptureMono>>,
  profile: PrinterProfile,
): Uint8Array | null {
  const rasterStart = Date.now();
  if (!monoHasInk(mono)) return null;
  const buffer = buildEscPosFromMono(mono, profile.cut_paper);
  recordPrintTimingSync({ raster_ms: Date.now() - rasterStart, print_path: 'js' });
  return buffer;
}

async function tryNativePrintAfterCapture(
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
      recordPrintTimingSync({ native_fallback_reason: null });
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

async function tryStripStreamAfterCapture(
  captured: PrintCaptureResult,
  profile: PrinterProfile,
): Promise<boolean> {
  if (profile.connection_type !== 'network_tcp' || !profile.ip?.trim()) return false;

  const run = async (mono: Awaited<ReturnType<typeof ensureCaptureMono>>): Promise<void> => {
    const rasterStart = Date.now();
    const stripHeight = TEMP_FORCE_JS_STRIP_ONLY ? STRIP_TEST_HEIGHT_PX : STRIP_HEIGHT_PX;
    const job = buildEscPosStripJob(mono, profile.cut_paper, stripHeight);
    await sendEscPosStripsOverTcp(profile.ip!, profile.port ?? 9100, job, {
      interStripDelayMs: TEMP_FORCE_JS_STRIP_ONLY ? STRIP_TEST_INTER_DELAY_MS : undefined,
      settleMs: TEMP_FORCE_JS_STRIP_ONLY ? STRIP_TEST_SETTLE_MS : undefined,
    });
    recordPrintTimingSync({ raster_ms: Date.now() - rasterStart, print_path: 'js_strip' });
    recordReceiptPrintPathSync(profile.id, profile.name, 'raster', null);
  };

  try {
    const mono = await ensureCaptureMono(captured, profile.paper_width);
    if (!monoHasInk(mono)) {
      if (TEMP_FORCE_JS_STRIP_ONLY) {
        throw new Error('وضع اختبار JS strip: صورة الإيصال فارغة.');
      }
      return false;
    }
    await run(mono);
    return true;
  } catch (err) {
    if (TEMP_FORCE_JS_STRIP_ONLY) throw err;
    return false;
  }
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
  options?: { forceJsPath?: boolean },
): Promise<RasterBuildResult> {
  if (TEMP_FORCE_JS_STRIP_ONLY) {
    assertJsStripTestProfile(profile);
    const captured = await captureReceiptWithTcpWarmup(payload, profile);
    const stripOk = await tryStripStreamAfterCapture(captured, profile);
    if (stripOk) {
      return { buffer: new Uint8Array(0), alreadySent: true };
    }
    throw new Error('وضع اختبار JS strip: فشل إرسال الشرائح.');
  }

  let captureError = 'فشل التقاط الصورة';
  try {
    const captured = await captureReceiptWithTcpWarmup(payload, profile);
    const skipNative = options?.forceJsPath;
    const nativeOk = !skipNative && (await tryNativePrintAfterCapture(captured, profile));
    if (nativeOk) {
      return { buffer: new Uint8Array(0), alreadySent: true };
    }
    const stripOk = await tryStripStreamAfterCapture(captured, profile);
    if (stripOk) {
      return { buffer: new Uint8Array(0), alreadySent: true };
    }
    const mono = await ensureCaptureMono(captured, profile.paper_width);
    const raster = tryBuildRasterFromMono(mono, profile);
    if (raster) {
      recordReceiptPrintPathSync(profile.id, profile.name, 'raster', null);
      return { buffer: raster, alreadySent: false };
    }
    captureError = 'صورة الإيصال فارغة';
  } catch (err) {
    captureError = err instanceof Error ? err.message : captureError;
  }
  return { buffer: buildTextFallback(payload, profile, captureError), alreadySent: false };
}

export async function buildReceiptBuffer(
  payload: ReceiptPrintPayload,
  profile: PrinterProfile,
  options?: { forceJsPath?: boolean },
): Promise<Uint8Array> {
  if (usesRasterEncoding(profile)) {
    const { buffer } = await buildRasterOrFallback(payload, profile, options);
    return buffer;
  }
  return buildReceiptEscPos(payload, profile);
}

/** Returns alreadySent when native or strip stream dispatched to printer. */
export async function buildAndMaybeDispatchReceipt(
  payload: ReceiptPrintPayload,
  profile: PrinterProfile,
  options?: { forceJsPath?: boolean },
): Promise<{ buffer: Uint8Array; alreadySent: boolean }> {
  if (TEMP_FORCE_FAST_TEXT) {
    return {
      buffer: buildReceiptEscPos(payload, effectiveReceiptProfile(profile, 'fast_text')),
      alreadySent: false,
    };
  }
  if (TEMP_FORCE_JS_STRIP_ONLY) {
    return buildRasterOrFallback(payload, rasterProfileForStripTest(profile), options);
  }
  if (!usesRasterEncoding(profile)) {
    return { buffer: buildReceiptEscPos(payload, profile), alreadySent: false };
  }
  return buildRasterOrFallback(payload, profile, options);
}

export async function dispatchReceiptBuffer(
  profile: PrinterProfile,
  buffer: Uint8Array,
  alreadySent: boolean,
): Promise<void> {
  if (alreadySent || buffer.length === 0) return;
  await sendEscPosOverTcp(profile.ip ?? '', profile.port, buffer);
}

export async function buildTestPageBuffer(
  profile: PrinterProfile,
): Promise<RasterBuildResult> {
  const effectiveProfile = TEMP_FORCE_JS_STRIP_ONLY ? rasterProfileForStripTest(profile) : profile;
  if (usesRasterEncoding(effectiveProfile) || TEMP_FORCE_JS_STRIP_ONLY) {
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
    return buildRasterOrFallback(payload, effectiveProfile);
  }
  return { buffer: buildTestPageEscPos(profile), alreadySent: false };
}

export async function buildArabicTestBuffer(
  profile: PrinterProfile,
): Promise<RasterBuildResult> {
  const effectiveProfile = TEMP_FORCE_JS_STRIP_ONLY ? rasterProfileForStripTest(profile) : profile;
  if (usesRasterEncoding(effectiveProfile) || TEMP_FORCE_JS_STRIP_ONLY) {
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
    return buildRasterOrFallback(payload, effectiveProfile);
  }
  return { buffer: buildArabicTestEscPos(profile), alreadySent: false };
}
