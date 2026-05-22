import { Platform } from 'react-native';

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
    write: (data: string | Uint8Array, encoding?: string, cb?: (err?: Error) => void) => void;
    end: () => void;
    destroy: () => void;
    on: (event: string, cb: (err?: Error) => void) => void;
  };
};

function loadTcpModule(): TcpSocketModule | null {
  if (Platform.OS === 'web') return null;
  try {
    // Optional native module — install `react-native-tcp-socket` + Expo prebuild for production.
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
  const TcpSocket = loadTcpModule();
  if (!TcpSocket) {
    throw new PrintTransportError(
      'NETWORK_TCP_UNAVAILABLE',
      'طباعة الشبكة TCP غير متاحة في Expo Go. استخدم Dev Client مع react-native-tcp-socket و prebuild.',
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
      clearTimeout(timer);
      if (err) reject(err);
      else resolve();
    };

    const timer = setTimeout(() => {
      client?.destroy();
      finish(new PrintTransportError('TCP_TIMEOUT', 'فشل الاتصال بالطابعة — انتهت المهلة.'));
    }, timeoutMs);

    const client = TcpSocket.createConnection({ port, host: ip.trim(), connectTimeout: timeoutMs }, () => {
      client.write(buffer, undefined, (writeErr) => {
        client.end();
        if (writeErr) finish(new PrintTransportError('TCP_WRITE_FAILED', writeErr.message));
        else finish();
      });
    });

    client.on('error', (err) => {
      client.destroy();
      finish(new PrintTransportError('TCP_CONNECT_FAILED', err?.message ?? 'فشل الاتصال بالطابعة'));
    });
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
  await new Promise<void>((resolve, reject) => {
    const client = TcpSocket.createConnection({ port, host: ip.trim(), connectTimeout: 5000 }, () => {
      client.end();
      resolve();
    });
    client.on('error', (err) => {
      client.destroy();
      reject(new PrintTransportError('TCP_CONNECT_FAILED', err?.message ?? 'الطابعة غير متصلة'));
    });
  });
}
