import { requireNativeModule, Platform } from 'expo-modules-core';

export type PaperWidth = '58mm' | '80mm';

export type PrintReceiptOptions = {
  ip: string;
  port?: number;
  imageBase64?: string;
  imageUri?: string;
  paperWidth?: PaperWidth;
  cut?: boolean;
  chunkSize?: number;
  settleMs?: number;
};

export type NativePrintTiming = {
  decodeMs: number;
  bitmapProcessMs: number;
  rasterMs: number;
  connectMs: number;
  transferMs: number;
  settleMs: number;
  totalMs: number;
  bytesSent: number;
  widthBefore: number;
  heightBefore: number;
  widthAfter: number;
  heightAfter: number;
  chunkSize: number;
};

export type DiagnoseResult = {
  reachable: boolean;
  connectMs: number;
  message: string;
};

export type ChunkBenchmarkResult = {
  chunkSize: number;
  transferMs: number;
  bytesSent: number;
  success: boolean;
  error: string | null;
};

type ThermalPrinterNative = {
  isAvailable(): Promise<boolean>;
  warmup(ip: string, port?: number): Promise<void>;
  diagnosePrinter(ip: string, port?: number): Promise<DiagnoseResult>;
  printReceipt(options: PrintReceiptOptions): Promise<NativePrintTiming>;
  benchmarkChunks(options: {
    ip: string;
    port?: number;
    imageBase64: string;
    paperWidth?: PaperWidth;
  }): Promise<ChunkBenchmarkResult[]>;
};

let nativeModule: ThermalPrinterNative | null | undefined;
let nativeModuleLoadError: string | null | undefined;

function getNativeModule(): ThermalPrinterNative | null {
  if (Platform.OS !== 'android') return null;
  if (nativeModule !== undefined) return nativeModule;
  try {
    nativeModule = requireNativeModule<ThermalPrinterNative>('ThermalPrinter');
    nativeModuleLoadError = null;
  } catch (err) {
    nativeModule = null;
    nativeModuleLoadError =
      err instanceof Error ? err.message : 'فشل تحميل الوحدة الأصلية ThermalPrinter';
  }
  return nativeModule;
}

/** Why requireNativeModule failed — usually APK built before the module was added. */
export function getNativeModuleLoadError(): string | null {
  if (Platform.OS !== 'android') return 'Android فقط';
  if (nativeModuleLoadError === undefined) {
    getNativeModule();
  }
  return nativeModuleLoadError ?? null;
}

export const ThermalPrinter = {
  async isAvailable(): Promise<boolean> {
    const mod = getNativeModule();
    if (!mod) return false;
    try {
      return await mod.isAvailable();
    } catch {
      return false;
    }
  },

  async warmup(ip: string, port = 9100): Promise<void> {
    const mod = getNativeModule();
    if (!mod) return;
    await mod.warmup(ip, port);
  },

  async diagnosePrinter(ip: string, port = 9100): Promise<DiagnoseResult> {
    const mod = getNativeModule();
    if (!mod) {
      return { reachable: false, connectMs: 0, message: 'الوحدة الأصلية غير متاحة (Android فقط)' };
    }
    return mod.diagnosePrinter(ip, port);
  },

  async printReceipt(options: PrintReceiptOptions): Promise<NativePrintTiming> {
    const mod = getNativeModule();
    if (!mod) throw new Error('ThermalPrinter native module unavailable');
    return mod.printReceipt(options);
  },

  async benchmarkChunks(
    ip: string,
    imageBase64: string,
    paperWidth: PaperWidth = '80mm',
    port = 9100,
  ): Promise<ChunkBenchmarkResult[]> {
    const mod = getNativeModule();
    if (!mod) throw new Error('ThermalPrinter native module unavailable');
    return mod.benchmarkChunks({ ip, port, imageBase64, paperWidth });
  },
};

export type PrintPipelineStage = 'JS_BASE64' | 'NATIVE_VIEW';

export type ThermalPrinterCapabilities = {
  pipelineStages: PrintPipelineStage[];
  persistentTcp: boolean;
  chunkBenchmark: boolean;
};

export function getThermalPrinterCapabilities(): ThermalPrinterCapabilities {
  return {
    pipelineStages: ['NATIVE_VIEW'],
    persistentTcp: Platform.OS === 'android',
    chunkBenchmark: Platform.OS === 'android',
  };
}
