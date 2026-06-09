import { PermissionsAndroid, Platform } from 'react-native';
import type { PrinterProfile } from '@/types/printing';
import { resolveCodePageTable } from './codePageTables';
import { encodingUsesSingleByte } from './arabicTextEncode';
import { prepareArabicLine } from './prepareArabicLine';
import { dotsForPaper } from './escposRaster';
import { PrintTransportError } from './networkTcpPrinter';

export type BluetoothDevice = { name: string; address: string };

type BleEscPosModule = {
  scanDevices: () => Promise<BluetoothDevice[]>;
  connect: (address: string) => Promise<void>;
  printerInit: () => Promise<void>;
  printText: (text: string, options?: Record<string, unknown>) => Promise<void>;
  printPic: (base64: string, options?: Record<string, unknown>) => Promise<void>;
  closeConn?: () => Promise<void>;
  ALIGN?: { CENTER: number };
};

type BleManagerModule = {
  connect: (address: string) => Promise<void>;
};

function loadBleModules(): { printer: BleEscPosModule; manager: BleManagerModule } | null {
  if (Platform.OS !== 'android') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@vardrz/react-native-bluetooth-escpos-printer') as {
      BluetoothEscposPrinter: BleEscPosModule;
      BluetoothManager: BleManagerModule;
    };
    return { printer: mod.BluetoothEscposPrinter, manager: mod.BluetoothManager };
  } catch {
    return null;
  }
}

export function getBluetoothUnsupportedMessage(): string {
  return 'طباعة البلوتوث مدعومة على Android فقط وتتطلب نسخة Dev/Production Build مع @vardrz/react-native-bluetooth-escpos-printer.';
}

export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const apiLevel = Platform.Version;
    if (typeof apiLevel === 'number' && apiLevel < 31) {
      const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      return r === PermissionsAndroid.RESULTS.GRANTED;
    }
    const r = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(r).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
  } catch {
    return false;
  }
}

export async function listPairedBluetoothPrinters(): Promise<BluetoothDevice[]> {
  const mod = loadBleModules();
  if (!mod) return [];
  try {
    const res = (await (mod.manager as BleManagerModule & {
      scanDevices?: () => Promise<{ paired?: BluetoothDevice[]; found?: BluetoothDevice[] }>;
    }).scanDevices?.()) as { paired?: BluetoothDevice[]; found?: BluetoothDevice[] } | undefined;
    return [...(res?.paired ?? []), ...(res?.found ?? [])];
  } catch {
    return [];
  }
}

export async function isBluetoothDeviceReachable(address: string): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const mod = loadBleModules();
  if (!mod || !address?.trim()) return false;
  try {
    await mod.manager.connect(address.trim());
    return true;
  } catch {
    return false;
  }
}

function bluetoothEncodingOptions(profile: PrinterProfile): Record<string, unknown> {
  const table = resolveCodePageTable(profile);
  const enc = profile.encoding;
  if (enc === 'cp864') {
    return { encoding: 'CP864', codepage: table.cp864, widthtimes: 0, heigthtimes: 0, fonttype: 0 };
  }
  if (enc === 'cp720') {
    return { encoding: 'CP720', codepage: table.cp720, widthtimes: 0, heigthtimes: 0, fonttype: 0 };
  }
  if (enc === 'windows1256' || encodingUsesSingleByte(enc)) {
    return { encoding: 'windows-1256', codepage: table.windows1256, widthtimes: 0, heigthtimes: 0, fonttype: 0 };
  }
  return { encoding: 'UTF-8', codepage: 0, widthtimes: 0, heigthtimes: 0, fonttype: 0 };
}

async function connectBluetooth(address: string): Promise<BleEscPosModule> {
  const mod = loadBleModules();
  if (!mod) {
    throw new PrintTransportError('BT_MODULE_MISSING', getBluetoothUnsupportedMessage());
  }
  if (!address?.trim()) {
    throw new PrintTransportError('BT_ADDRESS_REQUIRED', 'عنوان MAC للطابعة مطلوب.');
  }
  await mod.manager.connect(address.trim());
  await mod.printer.printerInit();
  return mod.printer;
}

/** Raster path — proven Arabic fix via community (#77). */
export async function sendPngBase64OverBluetooth(
  address: string,
  base64: string,
  profile: Pick<PrinterProfile, 'paper_width'>,
): Promise<void> {
  const printer = await connectBluetooth(address);
  const width = dotsForPaper(profile.paper_width);
  const paperSize = profile.paper_width === '58mm' ? 58 : 80;
  await printer.printPic(base64.replace(/^data:image\/\w+;base64,/, ''), {
    width,
    paperSize,
    center: true,
    autoCut: true,
  });
}

/** Text lines via library encoding (no raw printRaw — not exposed in @vardrz). */
export async function sendTextLinesOverBluetooth(
  address: string,
  lines: string[],
  profile: PrinterProfile,
): Promise<void> {
  const printer = await connectBluetooth(address);
  const opts = bluetoothEncodingOptions(profile);
  for (const line of lines) {
    const shaped = prepareArabicLine(line);
    await printer.printText(`${shaped}\n`, { ...opts, cut: false });
  }
  await printer.printText('\n\n', { ...opts, cut: profile.cut_paper });
}

/**
 * Legacy entry: TCP-style ESC/POS buffer on Bluetooth.
 * @vardrz has no printRaw — raster jobs must use sendPngBase64OverBluetooth.
 */
export async function sendEscPosOverBluetooth(address: string, buffer: Uint8Array): Promise<void> {
  void buffer;
  throw new PrintTransportError(
    'BT_RAW_UNSUPPORTED',
    'البلوتوث لا يدعم بايتات ESC/POS خام في هذه المكتبة. استخدم «UTF-8 صورة» أو Windows-1256.',
  );
}
