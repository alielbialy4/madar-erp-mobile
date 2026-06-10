import { Platform } from 'react-native';
import type { EscPosStripJob } from './escposStripRaster';
import { PrintTransportError } from './networkTcpPrinter';
import { recordPrintTimingSync } from './printTimingBuffer';
import { withTcpSendLock } from './tcpSendQueue';
import { DEFAULT_TCP_CHUNK_SIZE, DEFAULT_TCP_SETTLE_MS } from './tcpChunkUtils';
import { writeBufferFlushed } from './tcpWriteFlush';

export const DEFAULT_STRIP_INTER_DELAY_MS = 20;

const CONNECT_TIMEOUT_MS = 8000;

type TcpSocketClient = {
  write: (
    data: string | Uint8Array,
    encoding?: string,
    cb?: (err?: Error) => void,
  ) => boolean;
  destroy: () => void;
  on: (event: string, cb: (err?: Error) => void) => void;
};

type TcpSocketModule = {
  createConnection: (
    options: { port: number; host: string; connectTimeout?: number },
    callback?: () => void,
  ) => TcpSocketClient;
};

export type StripStreamResult = {
  stripCount: number;
  bytesSent: number;
  connectMs: number;
  transferMs: number;
  settleMs: number;
  stripStreamMs: number;
  interStripDelayMs: number;
};

function loadTcpModule(): TcpSocketModule | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-tcp-socket') as TcpSocketModule;
  } catch {
    return null;
  }
}

function poolKey(ip: string, port: number): string {
  return `${ip.trim()}:${port}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectFresh(ip: string, port: number): Promise<TcpSocketClient> {
  const TcpSocket = loadTcpModule();
  if (!TcpSocket) {
    throw new PrintTransportError(
      'NETWORK_TCP_UNAVAILABLE',
      'طباعة الشبكة TCP غير متاحة في Expo Go. استخدم Dev Client مع react-native-tcp-socket.',
    );
  }
  if (!ip?.trim()) {
    throw new PrintTransportError('INVALID_IP', 'عنوان IP الطابعة مطلوب.');
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const connectStartedAt = Date.now();
    const finish = (err?: Error, client?: TcpSocketClient) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      recordPrintTimingSync({ tcp_connect_ms: Date.now() - connectStartedAt });
      if (err) reject(err);
      else resolve(client!);
    };

    const timer = setTimeout(() => {
      finish(new PrintTransportError('TCP_TIMEOUT', 'فشل الاتصال بالطابعة — انتهت المهلة.'));
    }, CONNECT_TIMEOUT_MS);

    const client = TcpSocket.createConnection(
      { port, host: ip.trim(), connectTimeout: CONNECT_TIMEOUT_MS },
      () => finish(undefined, client),
    );

    client.on('error', (err) => {
      finish(new PrintTransportError('TCP_CONNECT_FAILED', err?.message ?? 'فشل الاتصال بالطابعة'));
    });
  });
}

function destroyClient(client: TcpSocketClient | null): void {
  if (!client) return;
  try {
    client.destroy();
  } catch {
    /* ignore */
  }
}

async function streamStripJobOnce(
  ip: string,
  port: number,
  job: EscPosStripJob,
  options: {
    chunkSize: number;
    interStripDelayMs: number;
    settleMs: number;
  },
): Promise<StripStreamResult> {
  const streamStartedAt = Date.now();
  let client: TcpSocketClient | null = null;
  let bytesSent = 0;
  const connectStartedAt = Date.now();

  try {
    client = await connectFresh(ip, port);
    const connectMs = Date.now() - connectStartedAt;

    const writeStartedAt = Date.now();
    bytesSent += (await writeBufferFlushed(client, job.preamble, options.chunkSize)).bytesWritten;

    for (let i = 0; i < job.strips.length; i += 1) {
      bytesSent += (await writeBufferFlushed(client, job.strips[i]!, options.chunkSize)).bytesWritten;
      if (i < job.strips.length - 1) {
        await sleep(options.interStripDelayMs);
      }
    }

    bytesSent += (await writeBufferFlushed(client, job.epilogue, options.chunkSize)).bytesWritten;
    const transferMs = Date.now() - writeStartedAt;
    recordPrintTimingSync({ tcp_write_ms: transferMs });

    const settleStartedAt = Date.now();
    await sleep(options.settleMs);
    const settleMsRecorded = Date.now() - settleStartedAt;
    recordPrintTimingSync({ tcp_settle_ms: settleMsRecorded });

    const stripStreamMs = Date.now() - streamStartedAt;
    recordPrintTimingSync({
      strip_stream_ms: stripStreamMs,
      strip_count: job.stripCount,
      strip_height_px: job.stripHeightPx,
      strip_inter_delay_ms: options.interStripDelayMs,
      raster_payload_bytes: bytesSent,
      print_path: 'js_strip',
    });

    return {
      stripCount: job.stripCount,
      bytesSent,
      connectMs,
      transferMs,
      settleMs: settleMsRecorded,
      stripStreamMs,
      interStripDelayMs: options.interStripDelayMs,
    };
  } catch (err) {
    if (bytesSent > 0) {
      throw err instanceof Error
        ? err
        : new PrintTransportError('TCP_WRITE_FAILED', 'فشل إرسال شرائح الصورة للطابعة.');
    }
    throw err;
  } finally {
    destroyClient(client);
  }
}

/** Open one TCP socket and stream GS v 0 strips with inter-strip flow control. */
export async function sendEscPosStripsOverTcp(
  ip: string,
  port: number,
  job: EscPosStripJob,
  options?: {
    chunkSize?: number;
    interStripDelayMs?: number;
    settleMs?: number;
  },
): Promise<StripStreamResult> {
  const chunkSize = options?.chunkSize ?? DEFAULT_TCP_CHUNK_SIZE;
  const interStripDelayMs = options?.interStripDelayMs ?? DEFAULT_STRIP_INTER_DELAY_MS;
  const settleMs = options?.settleMs ?? DEFAULT_TCP_SETTLE_MS;
  const key = poolKey(ip, port);

  return withTcpSendLock(key, async () => {
    try {
      return await streamStripJobOnce(ip, port, job, { chunkSize, interStripDelayMs, settleMs });
    } catch (firstErr) {
      try {
        return await streamStripJobOnce(ip, port, job, { chunkSize, interStripDelayMs, settleMs });
      } catch {
        throw firstErr;
      }
    }
  });
}
