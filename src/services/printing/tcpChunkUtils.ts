export const DEFAULT_TCP_CHUNK_SIZE = 8192;
export const DEFAULT_TCP_SETTLE_MS = 80;

/** Split buffer into fixed-size chunks (for tests and pooled TCP send). */
export function chunkUint8Array(buffer: Uint8Array, chunkSize: number): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.subarray(i, Math.min(i + chunkSize, buffer.length)));
  }
  return chunks;
}
