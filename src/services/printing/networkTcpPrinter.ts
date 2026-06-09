import { Platform } from 'react-native';
import {
  DEFAULT_TCP_CHUNK_SIZE,
  DEFAULT_TCP_SETTLE_MS,
  sendEscPosOverTcpPooled,
  warmupTcpPrinter,
} from './tcpPrinterPool';

export { warmupTcpPrinter };

export class PrintTransportError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'PrintTransportError';
  }
}

type TcpSocketModule = {
  createConnection: (
    options: { port: number; host: string; connectTimeout?: number },
    callback?: () => void,
  ) => {
    write: (
      data: string | Uint8Array,
      encoding?: string,
      cb?: (err?: Error) => void,
    ) => boolean;
    end: () => void;
    destroy: () => void;
    on: (event: string, cb: (err?: Error) => void) => void;
  };
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

export async function sendEscPosOverTcp(
  ip: string,
  port: number,
  buffer: Uint8Array,
  timeoutMs = 8000,
): Promise<void> {
  void timeoutMs;
  await sendEscPosOverTcpPooled(ip, port, buffer, {
    chunkSize: DEFAULT_TCP_CHUNK_SIZE,
    settleMs: DEFAULT_TCP_SETTLE_MS,
  });
}

export async function testTcpConnection(ip: string, port: number): Promise<void> {
  const TcpSocket = loadTcpModule();
  if (!TcpSocket) {
    throw new PrintTransportError(
      'NETWORK_TCP_UNAVAILABLE',
      'اختبار الاتصال يتطلب Dev/Production Build مع react-native-tcp-socket.',
    );
  }
  if (!ip?.trim()) {
    throw new PrintTransportError('INVALID_IP', 'عنوان IP الطابعة مطلوب.');
  }
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      try {
        client?.destroy();
      } catch {
        /* ignore */
      }
      if (err) reject(err);
      else resolve();
    };

    const timer = setTimeout(() => {
      finish(new PrintTransportError('TCP_TIMEOUT', 'انتهت مهلة اختبار الاتصال.'));
    }, 5000);

    const client = TcpSocket.createConnection(
      { port, host: ip.trim(), connectTimeout: 5000 },
      () => {
        try {
          client.end();
        } catch {
          /* ignore */
        }
        clearTimeout(timer);
        finish();
      },
    );

    client.on('error', (err) => {
      clearTimeout(timer);
      finish(new PrintTransportError('TCP_CONNECT_FAILED', err?.message ?? 'الطابعة غير متصلة'));
    });
  });
}
