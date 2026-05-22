import { Platform } from 'react-native';
import { PrintTransportError } from './networkTcpPrinter';

/**
 * AirPrint fallback — not silent. Requires `expo-print` in Dev/Production builds.
 */
export async function printHtmlViaAirPrint(html: string, jobName?: string): Promise<void> {
  if (Platform.OS !== 'ios') {
    throw new PrintTransportError('AIRPRINT_IOS_ONLY', 'AirPrint متاح على iOS فقط.');
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Print = require('expo-print') as {
      printAsync: (opts: { html: string; printerUrl?: string }) => Promise<void>;
    };
    await Print.printAsync({ html });
  } catch {
    throw new PrintTransportError(
      'AIRPRINT_UNAVAILABLE',
      'AirPrint يتطلب expo-print و Dev/Production Build. استخدم طابعة شبكة Ethernet للحصول على أفضل تجربة طباعة على iOS.',
    );
  }
  void jobName;
}

export function escPosToSimpleHtml(lines: string[]): string {
  const body = lines.map((l) => `<div style="font-family:monospace;font-size:12px">${l}</div>`).join('');
  return `<html><body dir="rtl">${body}</body></html>`;
}
