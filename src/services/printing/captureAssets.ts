import * as FileSystem from 'expo-file-system/legacy';
import type { PaperWidth } from '@/types/printing';
import { cacheMonoForBase64, monoHasInk, type MonoRaster } from './escposRaster';
import type { PrintCaptureResult } from './printCaptureRegistry';

let lastUriMonoCache: { uri: string; mono: MonoRaster } | null = null;

function normalizeFileUri(uri: string): string {
  return uri.startsWith('file://') ? uri : `file://${uri}`;
}

export async function readPngBase64FromUri(uri: string): Promise<string> {
  const path = normalizeFileUri(uri);
  return FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.Base64 });
}

export async function cacheMonoForPngUri(uri: string, paperWidth: PaperWidth): Promise<MonoRaster> {
  if (lastUriMonoCache?.uri === uri) return lastUriMonoCache.mono;
  const base64 = await readPngBase64FromUri(uri);
  const mono = cacheMonoForBase64(base64, paperWidth);
  lastUriMonoCache = { uri, mono };
  return mono;
}

export async function ensurePngBase64(result: PrintCaptureResult): Promise<string> {
  if (result.pngBase64) return result.pngBase64;
  const base64 = await readPngBase64FromUri(result.pngUri);
  result.pngBase64 = base64;
  return base64;
}

export async function ensureCaptureMono(
  result: PrintCaptureResult,
  paperWidth: PaperWidth,
): Promise<MonoRaster> {
  if (result.mono && monoHasInk(result.mono)) return result.mono;
  const mono = await cacheMonoForPngUri(result.pngUri, paperWidth);
  result.mono = mono;
  return mono;
}

export function clearUriMonoCache(): void {
  lastUriMonoCache = null;
}
