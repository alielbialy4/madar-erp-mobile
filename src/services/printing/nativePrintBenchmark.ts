import { Platform } from 'react-native';
import { ThermalPrinter } from 'madar-thermal-printer';
import type { PrinterProfile } from '@/types/printing';
import { capturePrint } from './printCaptureRegistry';
import {
  getPrintDiagnostics,
  recordPrintTimingSync,
  resetPendingPrintDiagnostics,
  type PrintTimingSnapshot,
} from './printDiagnostics';
import { appendBenchmarkHistory } from './printBenchmarkHistory';
import {
  isNativeThermalPrintAvailable,
  mergeNativeTimingIntoSnapshot,
  printReceiptNativeFromCapture,
} from './androidNativeThermalPrinter';
import { averageTiming, type BenchmarkRun } from './printBenchmark';
import { buildAndMaybeDispatchReceipt } from './receiptRaster';
import { sendEscPosOverTcp } from './networkTcpPrinter';

function samplePayload(branchName: string) {
  return {
    date: new Date().toLocaleString('ar-EG-u-nu-latn'),
    items: [
      { name: 'منتج تجريبي', quantity: 1, unit_price: 50 },
      { name: 'اختبار الطباعة العربية', quantity: 2, unit_price: 25 },
    ],
    subtotal: 100,
    discount: 0,
    tax: 0,
    total: 100,
    paid: 100,
    payment_type: 'cash',
    branch_name: branchName,
  };
}

export type BaselineComparison = {
  jsRuns: BenchmarkRun[];
  nativeRuns: BenchmarkRun[];
  jsAverage: PrintTimingSnapshot;
  nativeAverage: PrintTimingSnapshot;
};

export async function runBaselineBenchmark(
  profile: PrinterProfile,
  iterations = 10,
): Promise<BaselineComparison> {
  const jsRuns: BenchmarkRun[] = [];
  for (let i = 0; i < iterations; i += 1) {
    resetPendingPrintDiagnostics();
    const buildStart = Date.now();
    const { buffer, alreadySent } = await buildAndMaybeDispatchReceipt(
      samplePayload(`JS baseline #${i + 1}`),
      profile,
      { forceJsPath: true },
    );
    if (!alreadySent) {
      await sendEscPosOverTcp(profile.ip ?? '', profile.port, buffer);
    }
    const buildMs = Date.now() - buildStart;
    recordPrintTimingSync({
      dispatch_ms: buildMs,
      total_print_ms: buildMs,
      print_path: 'js',
    });
    const diag = await getPrintDiagnostics();
    jsRuns.push({ iteration: i + 1, paper_width: profile.paper_width, timing: diag.timing });
    await appendBenchmarkHistory(`JS baseline #${i + 1}`, diag.timing);
  }

  const nativeRuns: BenchmarkRun[] = [];
  const nativeOk = Platform.OS === 'android' && (await isNativeThermalPrintAvailable());
  if (nativeOk && profile.ip?.trim()) {
    for (let i = 0; i < iterations; i += 1) {
      resetPendingPrintDiagnostics();
      const captureStart = Date.now();
      const captured = await capturePrint({
        kind: 'receipt',
        payload: samplePayload(`Native benchmark #${i + 1}`),
        profile,
      });
      const renderMs = Date.now() - captureStart;
      const nativeTiming = await printReceiptNativeFromCapture(captured, profile);
      mergeNativeTimingIntoSnapshot(nativeTiming);
      const diag = await getPrintDiagnostics();
      const timing: PrintTimingSnapshot = {
        ...diag.timing,
        view_shot_ms: renderMs,
        total_print_ms: renderMs + nativeTiming.totalMs,
        print_path: 'native_android',
      };
      nativeRuns.push({ iteration: i + 1, paper_width: profile.paper_width, timing });
      await appendBenchmarkHistory(`Native benchmark #${i + 1}`, timing);
    }
  }

  return {
    jsRuns,
    nativeRuns,
    jsAverage: averageTiming(jsRuns),
    nativeAverage: averageTiming(nativeRuns),
  };
}

export function formatBaselineSummary(comparison: BaselineComparison): string {
  const js = comparison.jsAverage;
  const nat = comparison.nativeAverage;
  return [
    '=== Baseline comparison (averages) ===',
    `JS: total=${js.total_print_ms}ms render=${js.view_shot_ms}ms png=${js.png_decode_ms}ms mono=${js.mono_convert_ms}ms tcp_c=${js.tcp_connect_ms}ms tcp_w=${js.tcp_write_ms}ms`,
    `Native: total=${nat.total_print_ms}ms render=${nat.view_shot_ms}ms bitmap=${nat.native_bitmap_ms}ms raster=${nat.native_raster_ms}ms tcp_c=${nat.native_connect_ms}ms tcp_w=${nat.native_transfer_ms}ms`,
  ].join('\n');
}
