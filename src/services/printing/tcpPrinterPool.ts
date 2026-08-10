import { Platform } from 'react-native';
import { PrintTransportError } from './printTransportError';
import { recordPrintTimingSync } from './printTimingBuffer';
import { withTcpSendLock } from './tcpSendQueue';
import { chunkUint8Array, DEFAULT_TCP_CHUNK_SIZE, DEFAULT_TCP_SETTLE_MS } from './tcpChunkUtils';
import { writeBufferFlushed } from './tcpWriteFlush';

export { DEFAULT_TCP_CHUNK_SIZE, DEFAULT_TCP_SETTLE_MS };
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

const warmupPromises = new Map<string, Promise<void>>();

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

/**
 * Reachability ping: connect then close immediately — does not leave a socket in the pool.
 */
export function warmupTcpPrinter(ip: string, port: number): Promise<void> {
  if (!ip?.trim() || Platform.OS === 'web') return Promise.resolve();
  const key = poolKey(ip, port);
  const existing = warmupPromises.get(key);
  if (existing) return existing;
  const promise = connectFresh(ip, port)
    .then((client) => {
      destroyClient(client);
    })
    .catch(() => {
      /* warmup failure is non-fatal — send opens a fresh connection */
    })
    .finally(() => {
      warmupPromises.delete(key);
    });
  warmupPromises.set(key, promise);
  return promise;
}

/** @deprecated pool removed — kept for callers that clean up after legacy paths */
export function destroyTcpPrinter(ip: string, port: number): void {
  void ip;
  void port;
}

async function sendOnce(
  ip: string,
  port: number,
  buffer: Uint8Array,
  chunkSize: number,
  settleMs: number,
): Promise<void> {
  let client: TcpSocketClient | null = null;
  let bytesFlushed = 0;
  const writeStartedAt = Date.now();

  try {
    client = await connectFresh(ip, port);
    const { bytesWritten } = await writeBufferFlushed(client, buffer, chunkSize);
    bytesFlushed = bytesWritten;
    recordPrintTimingSync({ tcp_write_ms: Date.now() - writeStartedAt });

    const settleStartedAt = Date.now();
    await new Promise((r) => setTimeout(r, settleMs));
    recordPrintTimingSync({ tcp_settle_ms: Date.now() - settleStartedAt });
  } catch (err) {
    if (bytesFlushed > 0) {
      throw err instanceof Error
        ? err
        : new PrintTransportError('TCP_WRITE_FAILED', 'فشل إرسال البيانات للطابعة بعد بدء الكتابة.');
    }
    throw err;
  } finally {
    destroyClient(client);
  }
}

export async function sendEscPosOverTcpPooled(
  ip: string,
  port: number,
  buffer: Uint8Array,
  options?: { chunkSize?: number; settleMs?: number },
): Promise<void> {
  const chunkSize = options?.chunkSize ?? DEFAULT_TCP_CHUNK_SIZE;
  const settleMs = options?.settleMs ?? DEFAULT_TCP_SETTLE_MS;
  const key = poolKey(ip, port);

  await withTcpSendLock(key, async () => {
    try {
      await sendOnce(ip, port, buffer, chunkSize, settleMs);
    } catch (firstErr) {
      try {
        await sendOnce(ip, port, buffer, chunkSize, settleMs);
      } catch {
        throw firstErr;
      }
    }
  });
}

export { chunkUint8Array };
