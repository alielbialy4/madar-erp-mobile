import { Platform } from 'react-native';
import { designColors } from '@/constants/colors';
import { PrintTransportError } from './networkTcpPrinter';

/**
 * AirPrint fallback — not silent (iOS shows the system print dialog).
 * Requires `expo-print` in a Dev Client / production build.
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
    await Print.printAsync({ html, printerUrl: jobName || undefined });
  } catch (err) {
    throw new PrintTransportError(
      'AIRPRINT_UNAVAILABLE',
      err instanceof Error ? err.message : 'AirPrint يتطلب expo-print و Dev/Production Build.',
    );
  }
}

/**
 * Legacy helper — wraps plain string lines in monospace HTML for AirPrint.
 * Kept for backward compat with any external callers.
 */
export function escPosToSimpleHtml(lines: string[]): string {
  const body = lines.map((l) => `<div style="font-family:monospace;font-size:12px">${escapeHtml(l)}</div>`).join('');
  return `<html><body dir="rtl">${body}</body></html>`;
}

/**
 * Convert an ESC/POS byte buffer into readable monospace HTML for AirPrint.
 * Strips control sequences (ESC *, GS *) and decodes the remaining text payload.
 *
 * AirPrint is a fallback path — it cannot speak raw ESC/POS, so we render the
 * receipt as styled text. Lossy (no barcode/QR rendering), but receipts/kitchen
 * tickets (which are mostly text) come through cleanly.
 */
export function escPosBufferToHtml(buffer: Uint8Array): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const text = decoder.decode(buffer);
  // Drop ESC/POS control sequences: ESC (1B) and GS (1D) followed by command bytes.
  // Keep printable chars, whitespace, and line feeds (which become <br>).
  const stripped = text
    .replace(/\u001b[\x00-\xff]/g, '')
    .replace(/\u001d[\x00-\xff]/g, '')
    .replace(/\u0000/g, '');
  // Split on LF and render each line as a div to preserve line structure.
  const lines = stripped.split('\n').map((line) => escapeHtml(line || ' '));
  const body = lines
    .map((l) => `<div style="font-family:Menlo,Consolas,monospace;font-size:11px;line-height:1.35;white-space:pre">${l}</div>`)
    .join('');
  return `<html><head><meta charset="utf-8"><style>body{margin:8px;color:${designColors.black};background:${designColors.white}}</style></head><body dir="rtl">${body}</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
