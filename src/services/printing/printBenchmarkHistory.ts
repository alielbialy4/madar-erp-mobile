import { storageGet, storageSet } from '@/services/storage';
import type { PrintTimingSnapshot } from './printTimingTypes';

const HISTORY_KEY = 'madar.print.benchmark_history';
const MAX_ENTRIES = 20;

export type BenchmarkHistoryEntry = {
  id: string;
  label: string;
  path: 'js' | 'js_strip' | 'native_android';
  recorded_at: string;
  timing: PrintTimingSnapshot;
};

export async function appendBenchmarkHistory(
  label: string,
  timing: PrintTimingSnapshot,
): Promise<void> {
  const existing = await storageGet<BenchmarkHistoryEntry[]>(HISTORY_KEY);
  const entry: BenchmarkHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label,
    path: timing.print_path ?? 'js',
    recorded_at: new Date().toISOString(),
    timing,
  };
  const next = [entry, ...(existing ?? [])].slice(0, MAX_ENTRIES);
  await storageSet(HISTORY_KEY, next);
}

export async function getBenchmarkHistory(): Promise<BenchmarkHistoryEntry[]> {
  return (await storageGet<BenchmarkHistoryEntry[]>(HISTORY_KEY)) ?? [];
}

export async function clearBenchmarkHistory(): Promise<void> {
  await storageSet(HISTORY_KEY, []);
}
