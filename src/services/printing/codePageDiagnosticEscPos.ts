import type { PrinterProfile } from '@/types/printing';
import { encodeForPrinter } from './arabicTextEncode';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

/** TEMP: routes buildReceiptEscPos / buildArabicTestEscPos to the CP sweep — disable after testing. */
export const TEMP_CODE_PAGE_DIAGNOSTIC_LOOP = false;

/** Common ESC/POS Arabic code page IDs (ESC t n) across Epson / Xprinter / Rongta firmware. */
export const CODE_PAGE_DIAGNOSTIC_CANDIDATES = [
  16, 21, 22, 29, 31, 42, 50, 51, 64, 70, 72, 255,
] as const;

export const CODE_PAGE_DIAGNOSTIC_ARABIC_WORD = 'تجربة';

/**
 * Prints one line per code page: `CP n: تجربة`
 * Win-1256 bytes + BiDi visual order; only ESC t n varies per line.
 */
export function buildCodePageArabicDiagnosticEscPos(
  profile?: Pick<PrinterProfile, 'cut_paper'>,
): Uint8Array {
  const chunks: number[] = [];
  const arabicBytes = encodeForPrinter(CODE_PAGE_DIAGNOSTIC_ARABIC_WORD, 'windows1256');

  for (const n of CODE_PAGE_DIAGNOSTIC_CANDIDATES) {
    chunks.push(ESC, 0x40);
    chunks.push(ESC, 0x74, n & 0xff);

    const label = `CP ${n}: `;
    for (let i = 0; i < label.length; i += 1) {
      chunks.push(label.charCodeAt(i) & 0xff);
    }

    chunks.push(...arabicBytes, LF);
  }

  chunks.push(LF, LF, LF);
  if (profile?.cut_paper !== false) {
    chunks.push(GS, 0x56, 0);
  }

  return Uint8Array.from(chunks);
}
