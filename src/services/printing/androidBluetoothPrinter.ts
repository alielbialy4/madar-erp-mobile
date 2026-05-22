import { Platform } from 'react-native';
import { PrintTransportError } from './networkTcpPrinter';

export type BluetoothDevice = { name: string; address: string };

function loadBleEscPosModule(): {
  scanDevices: () => Promise<BluetoothDevice[]>;
  connect: (address: string) => Promise<void>;
  printRaw: (data: Uint8Array) => Promise<void>;
} | null {
  if (Platform.OS !== 'android') return null;
  try {
    // Placeholder for e.g. `react-native-bluetooth-escpos-printer` — requires Dev Client.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-bluetooth-escpos-printer');
  } catch {
    return null;
  }
}

export function getBluetoothUnsupportedMessage(): string {
  return 'طباعة البلوتوث مدعومة على Android فقط وتتطلب نسخة Dev/Production Build.';
}

export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  // Permissions are declared in app.json; runtime request needs expo prebuild + native module.
  return false;
}

export async function listPairedBluetoothPrinters(): Promise<BluetoothDevice[]> {
  const mod = loadBleEscPosModule();
  if (!mod) return [];
  return mod.scanDevices();
}

export async function sendEscPosOverBluetooth(address: string, buffer: Uint8Array): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new PrintTransportError('BT_ANDROID_ONLY', 'البلوتوث متاح على Android فقط.');
  }
  const mod = loadBleEscPosModule();
  if (!mod) {
    throw new PrintTransportError('BT_MODULE_MISSING', getBluetoothUnsupportedMessage());
  }
  if (!address?.trim()) {
    throw new PrintTransportError('BT_ADDRESS_REQUIRED', 'عنوان MAC للطابعة مطلوب.');
  }
  await mod.connect(address.trim());
  await mod.printRaw(buffer);
}
