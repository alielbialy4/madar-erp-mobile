/** Max buffer size for a single write (typical receipt raster fits here). */
export const SINGLE_WRITE_MAX_BYTES = 256 * 1024;

export type TcpWriteClient = {
  write: (
    data: Uint8Array,
    encoding?: string,
    cb?: (err?: Error) => void,
  ) => boolean;
  on: (event: string, cb: () => void) => void;
  removeListener?: (event: string, cb: () => void) => void;
};

/** Wait until react-native-tcp-socket fires the write callback (native "written" event). */
export function writeSliceFlushed(client: TcpWriteClient, slice: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve();
    };

    try {
      const ok = client.write(slice, undefined, (err) => {
        finish(err);
      });
      void ok;
    } catch (err) {
      finish(err instanceof Error ? err : new Error('TCP write failed'));
    }
  });
}

export async function writeBufferFlushed(
  client: TcpWriteClient,
  buffer: Uint8Array,
  chunkSize: number,
): Promise<{ bytesWritten: number }> {
  const effectiveChunk =
    buffer.length <= SINGLE_WRITE_MAX_BYTES
      ? Math.max(1, buffer.length)
      : Math.max(1, chunkSize);
  let offset = 0;
  while (offset < buffer.length) {
    const end = Math.min(offset + effectiveChunk, buffer.length);
    await writeSliceFlushed(client, buffer.subarray(offset, end));
    offset = end;
  }
  return { bytesWritten: buffer.length };
}
