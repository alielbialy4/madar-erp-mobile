import { Platform } from 'react-native';
import {
  getNativeModuleLoadError,
  ThermalPrinter,
  type NativePrintTiming,
  type PrintReceiptOptions,
} from 'madar-thermal-printer';
import type { PaperWidth, PrinterProfile } from '@/types/printing';
import type { PrintCaptureResult } from './printCaptureRegistry';
import { ensurePngBase64 } from './captureAssets';
import { recordPrintTimingSync } from './printDiagnostics';

let availabilityCache: boolean | null = null;

export async function isNativeThermalPrintAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (getNativeModuleLoadError()) return false;
  if (availabilityCache !== null) return availabilityCache;
  try {
    availabilityCache = await ThermalPrinter.isAvailable();
  } catch {
    availabilityCache = false;
  }
  return availabilityCache;
}

export function describeNativeModuleStatus(): string {
  if (Platform.OS !== 'android') return 'Native printing: Android فقط';
  const loadError = getNativeModuleLoadError();
  if (loadError) {
    return [
      'الوحدة الأصلية غير موجودة في هذا الـ APK.',
      loadError,
      'الحل: أعد بناء dev client بعد إضافة madar-thermal-printer ثم ثبّت الـ APK الجديد.',
    ].join('\n');
  }
  return 'الوحدة الأصلية محمّلة في الـ APK ✓';
}

export function shouldUseNativeThermalPrint(profile: PrinterProfile): boolean {
  return (
    Platform.OS === 'android' &&
    profile.connection_type === 'network_tcp' &&
    Boolean(profile.ip?.trim())
  );
}

export function mergeNativeTimingIntoSnapshot(timing: NativePrintTiming): void {
  recordPrintTimingSync({
    native_decode_ms: timing.decodeMs,
    native_bitmap_ms: timing.bitmapProcessMs,
    native_raster_ms: timing.rasterMs,
    native_connect_ms: timing.connectMs,
    native_transfer_ms: timing.transferMs,
    native_settle_ms: timing.settleMs,
    native_total_ms: timing.totalMs,
    raster_payload_bytes: timing.bytesSent,
    receipt_height_px: timing.heightAfter,
    tcp_connect_ms: timing.connectMs,
    tcp_write_ms: timing.transferMs,
    tcp_settle_ms: timing.settleMs,
    png_decode_ms: 0,
    mono_convert_ms: 0,
    mono_crop_ms: 0,
    gs_v0_build_ms: timing.rasterMs,
    raster_ms: timing.bitmapProcessMs + timing.rasterMs,
    print_path: 'native_android',
  });
}

function basePrintOptions(
  profile: Pick<PrinterProfile, 'ip' | 'port' | 'paper_width' | 'cut_paper'>,
): Pick<PrintReceiptOptions, 'ip' | 'port' | 'paperWidth' | 'cut'> {
  return {
    ip: profile.ip ?? '',
    port: profile.port ?? 9100,
    paperWidth: profile.paper_width as PaperWidth,
    cut: profile.cut_paper,
  };
}

export async function printReceiptNativeFromUri(
  pngUri: string,
  profile: Pick<PrinterProfile, 'ip' | 'port' | 'paper_width' | 'cut_paper'>,
): Promise<NativePrintTiming> {
  const timing = await ThermalPrinter.printReceipt({
    ...basePrintOptions(profile),
    imageUri: pngUri,
  });
  mergeNativeTimingIntoSnapshot(timing);
  return timing;
}

export async function printReceiptNative(
  pngBase64: string,
  profile: Pick<PrinterProfile, 'ip' | 'port' | 'paper_width' | 'cut_paper'>,
): Promise<NativePrintTiming> {
  const timing = await ThermalPrinter.printReceipt({
    ...basePrintOptions(profile),
    imageBase64: pngBase64,
  });
  mergeNativeTimingIntoSnapshot(timing);
  return timing;
}

export async function printReceiptNativeFromCapture(
  captured: PrintCaptureResult,
  profile: Pick<PrinterProfile, 'ip' | 'port' | 'paper_width' | 'cut_paper'>,
): Promise<NativePrintTiming> {
  if (captured.pngUri?.trim()) {
    return printReceiptNativeFromUri(captured.pngUri, profile);
  }
  const base64 = captured.pngBase64 ?? (await ensurePngBase64(captured));
  return printReceiptNative(base64, profile);
}

export async function warmupNativePrinter(ip: string, port: number): Promise<void> {
  if (!(await isNativeThermalPrintAvailable())) return;
  await ThermalPrinter.warmup(ip, port);
}

export { ThermalPrinter };
