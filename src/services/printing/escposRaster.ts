import UPNG from 'upng-js';
import type { PaperWidth } from '@/types/printing';
import { recordPrintTimingSync } from './printTimingBuffer';

export type MonoRaster = { width: number; height: number; data: Uint8Array };

export type MonoRasterTiming = {
  png_decode_ms: number;
  mono_convert_ms: number;
  mono_crop_ms: number;
};

export function dotsForPaper(width: PaperWidth): number {
  return width === '58mm' ? 384 : 576;
}

function decodeBase64Png(base64: string): Uint8Array {
  const raw = base64.replace(/^data:image\/\w+;base64,/, '').trim();
  const binary = atob(raw);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

function rowHasInk(data: Uint8Array, bytesPerRow: number, row: number): boolean {
  const start = row * bytesPerRow;
  const end = start + bytesPerRow;
  for (let i = start; i < end; i += 1) {
    if (data[i] !== 0) return true;
  }
  return false;
}

/** Trim leading/trailing blank rows — reduces GS v 0 payload without changing receipt content. */
export function trimMonoVerticalWhitespace(mono: MonoRaster): MonoRaster {
  const bytesPerRow = Math.ceil(mono.width / 8);
  if (mono.height <= 0) return mono;

  let top = 0;
  while (top < mono.height && !rowHasInk(mono.data, bytesPerRow, top)) top += 1;

  let bottom = mono.height - 1;
  while (bottom >= top && !rowHasInk(mono.data, bytesPerRow, bottom)) bottom -= 1;

  if (top === 0 && bottom === mono.height - 1) return mono;

  const newHeight = Math.max(1, bottom - top + 1);
  const trimmed = new Uint8Array(bytesPerRow * newHeight);
  trimmed.set(mono.data.subarray(top * bytesPerRow, (bottom + 1) * bytesPerRow));
  return { width: mono.width, height: newHeight, data: trimmed };
}

/** PNG bytes → 1-bit raster rows (MSB = leftmost dot). */
export function pngToMonoRaster(
  pngBytes: Uint8Array,
  targetWidthDots: number,
  onTiming?: (timing: MonoRasterTiming) => void,
): MonoRaster {
  const decodeStart = Date.now();
  const arrayBuffer = pngBytes.buffer.slice(
    pngBytes.byteOffset,
    pngBytes.byteOffset + pngBytes.byteLength,
  ) as ArrayBuffer;
  const decoded = UPNG.decode(arrayBuffer);
  const rgba = new Uint8Array(UPNG.toRGBA8(decoded)[0]);
  const pngDecodeMs = Date.now() - decodeStart;

  const convertStart = Date.now();
  const srcW = decoded.width;
  const srcH = decoded.height;
  const scale = Math.min(1, targetWidthDots / srcW);
  const outW = Math.max(1, Math.min(targetWidthDots, Math.round(srcW * scale)));
  const outH = Math.max(1, Math.round(srcH * scale));
  const bytesPerRow = Math.ceil(outW / 8);
  const raster = new Uint8Array(bytesPerRow * outH);

  const noScale = scale >= 0.999 && srcW === outW;

  if (noScale) {
    for (let y = 0; y < outH; y += 1) {
      for (let x = 0; x < outW; x += 1) {
        const idx = (y * srcW + x) * 4;
        const r = rgba[idx] ?? 255;
        const g = rgba[idx + 1] ?? 255;
        const b = rgba[idx + 2] ?? 255;
        const a = rgba[idx + 3] ?? 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (a <= 32 || lum >= 200) continue;
        const byteIndex = y * bytesPerRow + (x >> 3);
        raster[byteIndex] |= 1 << (7 - (x & 7));
      }
    }
  } else {
    for (let y = 0; y < outH; y += 1) {
      const srcY = Math.min(srcH - 1, Math.floor(y / scale));
      for (let x = 0; x < outW; x += 1) {
        const srcX = Math.min(srcW - 1, Math.floor(x / scale));
        const idx = (srcY * srcW + srcX) * 4;
        const r = rgba[idx] ?? 255;
        const g = rgba[idx + 1] ?? 255;
        const b = rgba[idx + 2] ?? 255;
        const a = rgba[idx + 3] ?? 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (a <= 32 || lum >= 200) continue;
        const byteIndex = y * bytesPerRow + (x >> 3);
        raster[byteIndex] |= 1 << (7 - (x & 7));
      }
    }
  }
  const monoConvertMs = Date.now() - convertStart;

  const cropStart = Date.now();
  const trimmed = trimMonoVerticalWhitespace({ width: outW, height: outH, data: raster });
  const monoCropMs = Date.now() - cropStart;

  onTiming?.({
    png_decode_ms: pngDecodeMs,
    mono_convert_ms: monoConvertMs,
    mono_crop_ms: monoCropMs,
  });
  recordPrintTimingSync({
    png_decode_ms: pngDecodeMs,
    mono_convert_ms: monoConvertMs,
    mono_crop_ms: monoCropMs,
  });

  return trimmed;
}

let lastMonoCache: { base64: string; mono: MonoRaster } | null = null;

export function cacheMonoForBase64(base64: string, paperWidth: PaperWidth): MonoRaster {
  const pngBytes = decodeBase64Png(base64);
  const mono = pngToMonoRaster(pngBytes, dotsForPaper(paperWidth));
  lastMonoCache = { base64, mono };
  return mono;
}

export function getCachedMonoForBase64(base64: string): MonoRaster | null {
  if (lastMonoCache?.base64 === base64) return lastMonoCache.mono;
  return null;
}

export function clearMonoCache(): void {
  lastMonoCache = null;
}

export function monoHasInk(mono: MonoRaster): boolean {
  return mono.data.some((b) => b !== 0);
}

export function rasterHasInk(base64: string, paperWidth: PaperWidth): boolean {
  try {
    const cached = getCachedMonoForBase64(base64);
    if (cached) return monoHasInk(cached);
    const pngBytes = decodeBase64Png(base64);
    const mono = pngToMonoRaster(pngBytes, dotsForPaper(paperWidth));
    return monoHasInk(mono);
  } catch {
    return false;
  }
}

/** Mono raster → compact 1-bit PNG base64 for Bluetooth printPic. */
export function monoToPngBase64(mono: MonoRaster): string {
  const rgba = new Uint8Array(mono.width * mono.height * 4);
  const bytesPerRow = Math.ceil(mono.width / 8);
  for (let y = 0; y < mono.height; y += 1) {
    for (let x = 0; x < mono.width; x += 1) {
      const byteIndex = y * bytesPerRow + (x >> 3);
      const bit = (mono.data[byteIndex]! >> (7 - (x & 7))) & 1;
      const idx = (y * mono.width + x) * 4;
      const v = bit ? 0 : 255;
      rgba[idx] = v;
      rgba[idx + 1] = v;
      rgba[idx + 2] = v;
      rgba[idx + 3] = 255;
    }
  }
  const png = new Uint8Array(UPNG.encode([rgba.buffer], mono.width, mono.height, 0));
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < png.length; i += chunk) {
    binary += String.fromCharCode(...png.subarray(i, i + chunk));
  }
  return btoa(binary);
}
