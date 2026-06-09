import * as FileSystem from 'expo-file-system/legacy';

const cache = new Map<string, string>();

function cacheKey(url: string): string {
  const hash = url.replace(/[^a-zA-Z0-9]/g, '_').slice(-80);
  return `${FileSystem.cacheDirectory}print-logo-${hash}`;
}

/** Downloads remote logo to local cache for reliable view-shot capture. */
export async function resolvePrintLogoUri(url: string | null | undefined): Promise<string | null> {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('file://') || trimmed.startsWith('data:')) return trimmed;
  const cached = cache.get(trimmed);
  if (cached) return cached;
  try {
    const dest = cacheKey(trimmed);
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) {
      cache.set(trimmed, dest);
      return dest;
    }
    const result = await FileSystem.downloadAsync(trimmed, dest);
    if (result.uri) {
      cache.set(trimmed, result.uri);
      return result.uri;
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}

export function clearPrintLogoCache(): void {
  cache.clear();
}
