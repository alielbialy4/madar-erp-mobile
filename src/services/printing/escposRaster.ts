import UPNG from 'upng-js';
import type { PaperWidth } from '@/types/printing';

const GS = 0x1d;
const ESC = 0x1b;

export type MonoRaster = { width: number; height: number; data: Uint8Array };

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

/** PNG bytes → 1-bit raster rows (MSB = leftmost dot). */
export function pngToMonoRaster(
  pngBytes: Uint8Array,
  targetWidthDots: number,
): MonoRaster {
  const copy = Uint8Array.from(pngBytes);
  const decoded = UPNG.decode(copy.buffer);
  const rgba = new Uint8Array(UPNG.toRGBA8(decoded)[0]);
  const srcW = decoded.width;
  const srcH = decoded.height;
  const scale = Math.min(1, targetWidthDots / srcW);
  const outW = Math.max(1, Math.min(targetWidthDots, Math.round(srcW * scale)));
  const outH = Math.max(1, Math.round(srcH * scale));
  const bytesPerRow = Math.ceil(outW / 8);
  const raster = new Uint8Array(bytesPerRow * outH);

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
      const ink = a > 32 && lum < 200;
      if (!ink) continue;
      const byteIndex = y * bytesPerRow + Math.floor(x / 8);
      const bit = 7 - (x % 8);
      raster[byteIndex] |= 1 << bit;
    }
  }

  return { width: outW, height: outH, data: raster };
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

/** GS v 0 — raster bit image body (without init/feed/cut). */
export function buildGsV0Raster(mono: MonoRaster): Uint8Array {
  const bytesPerRow = Math.ceil(mono.width / 8);
  const xL = bytesPerRow & 0xff;
  const xH = (bytesPerRow >> 8) & 0xff;
  const yL = mono.height & 0xff;
  const yH = (mono.height >> 8) & 0xff;
  const header = [GS, 0x76, 0x30, 0x00, xL, xH, yL, yH];
  const out = new Uint8Array(header.length + mono.data.length);
  out.set(header, 0);
  out.set(mono.data, header.length);
  return out;
}

export function buildEscPosFromMono(mono: MonoRaster, cut = true): Uint8Array {
  const parts: number[] = [
    ESC, 0x40,
    ESC, 0x33, 0x00,
    ...buildGsV0Raster(mono),
    ESC, 0x64, 0x05,
  ];
  if (cut) parts.push(GS, 0x56, 0x00);
  return Uint8Array.from(parts);
}

export function buildEscPosFromPngBase64(base64: string, paperWidth: PaperWidth, cut = true): Uint8Array {
  const cached = getCachedMonoForBase64(base64);
  const mono = cached ?? cacheMonoForBase64(base64, paperWidth);
  return buildEscPosFromMono(mono, cut);
}
