import type { PrinterProfile, ReceiptPrintPayload } from '@/types/printing';
import {
  emptyTiming,
  getPrintDiagnostics,
  type PrintTimingSnapshot,
} from './printDiagnostics';
import { printEngine } from './printEngine';

export type BenchmarkRun = {
  iteration: number;
  paper_width: PrinterProfile['paper_width'];
  timing: PrintTimingSnapshot;
};

function sampleReceiptPayload(branchName: string): ReceiptPrintPayload {
  return {
    date: new Date().toLocaleString('ar-EG-u-nu-latn'),
    items: [
      { name: 'منتج تجريبي', quantity: 1, unit_price: 50 },
      { name: 'اختبار الأداء', quantity: 2, unit_price: 25 },
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

function timingMs(t: PrintTimingSnapshot, key: keyof PrintTimingSnapshot): string {
  const v = t[key];
  return typeof v === 'number' ? `${v}` : '—';
}

export function formatBenchmarkTable(runs: BenchmarkRun[]): string {
  const header =
    'iter | paper | total | gates | view_shot | png | mono | crop | gs_v0 | tcp_c | tcp_w | tcp_s | payload';
  const rows = runs.map((r) => {
    const t = r.timing;
    return [
      r.iteration,
      r.paper_width,
      timingMs(t, 'total_print_ms'),
      timingMs(t, 'capture_gates_ms'),
      timingMs(t, 'view_shot_ms'),
      timingMs(t, 'png_decode_ms'),
      timingMs(t, 'mono_convert_ms'),
      timingMs(t, 'mono_crop_ms'),
      timingMs(t, 'gs_v0_build_ms'),
      timingMs(t, 'tcp_connect_ms'),
      timingMs(t, 'tcp_write_ms'),
      timingMs(t, 'tcp_settle_ms'),
      timingMs(t, 'raster_payload_bytes'),
    ].join(' | ');
  });
  return [header, ...rows].join('\n');
}

export function averageTiming(runs: BenchmarkRun[]): PrintTimingSnapshot {
  const keys = Object.keys(emptyTiming) as (keyof PrintTimingSnapshot)[];
  const avg: PrintTimingSnapshot = { ...emptyTiming };
  for (const key of keys) {
    if (key === 'measured_at' || key === 'receipt_print_mode' || key === 'direct_checkout') continue;
    const nums = runs
      .map((r) => r.timing[key])
      .filter((v): v is number => typeof v === 'number');
    if (nums.length > 0) {
      (avg as Record<string, unknown>)[key] = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
    }
  }
  avg.measured_at = new Date().toISOString();
  return avg;
}

/**
 * Dev helper: run N checkout raster prints and log timing breakdown to console.
 * Requires PrintCaptureHost mounted and TCP printer reachable for full pipeline.
 */
export async function runPrintBenchmark(
  profile: PrinterProfile,
  options?: { iterations?: number; label?: string },
): Promise<BenchmarkRun[]> {
  const iterations = options?.iterations ?? 3;
  const label = options?.label ?? profile.name;
  const runs: BenchmarkRun[] = [];

  for (let i = 0; i < iterations; i += 1) {
    await printEngine.printReceiptCheckout(
      sampleReceiptPayload(`Benchmark ${label} #${i + 1}`),
      profile,
      'quality_image',
    );
    const diag = await getPrintDiagnostics();
    runs.push({
      iteration: i + 1,
      paper_width: profile.paper_width,
      timing: diag.timing,
    });
  }

  if (__DEV__) {
    console.log(`[printBenchmark] ${label} (${profile.paper_width}, ${iterations} runs)`);
    console.log(formatBenchmarkTable(runs));
    console.log('[printBenchmark] averages:', averageTiming(runs));
  }

  return runs;
}
