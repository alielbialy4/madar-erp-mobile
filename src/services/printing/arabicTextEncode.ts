import type { EscPosEncoding } from '@/types/printing';
import { prepareArabicText } from './prepareArabicLine';
import { encodeSbcs, type SbcsCharset } from './sbcsEncoder';

const utf8Encoder = new TextEncoder();

const SBCS_CHARSET: Partial<Record<EscPosEncoding, SbcsCharset>> = {
  cp864: 'cp864',
  cp720: 'cp720',
  windows1256: 'windows1256',
};

function encodeUtf8(text: string): Uint8Array {
  return utf8Encoder.encode(text);
}

/**
 * SBCS code pages (W1256/CP720) map logical Arabic (U+06xx).
 * Reshaper output (U+FE8x presentation forms) is NOT in those tables → '?' garbage on paper.
 * The printer ROM connects letters when the correct ESC t code page is selected.
 */
function prepareSourceForEncoding(text: string, encoding: EscPosEncoding, shapeArabic: boolean): string {
  if (!shapeArabic || encoding === 'utf8' || encoding === 'utf8_image') return text;
  // W1256/CP720 byte maps use logical Arabic (U+06xx); printer ROM connects letters.
  if (encoding === 'windows1256' || encoding === 'cp720') return text;
  // CP864 byte map stores isolated presentation forms (U+FE8x) — reshape first.
  return prepareArabicText(text);
}

/**
 * Encode receipt text for ESC/POS according to profile encoding.
 * Pure-JS SBCS tables — no Node iconv-lite (React Native safe).
 */
export function encodeForPrinter(text: string, encoding: EscPosEncoding, shapeArabic = true): Uint8Array {
  const source = prepareSourceForEncoding(text, encoding, shapeArabic);

  if (encoding === 'utf8' || encoding === 'utf8_image') {
    return encodeUtf8(source);
  }

  const charset = SBCS_CHARSET[encoding];
  if (!charset) return encodeUtf8(source);
  return encodeSbcs(source, charset);
}

export function encodingUsesSingleByte(encoding: EscPosEncoding): boolean {
  return encoding === 'cp864' || encoding === 'cp720' || encoding === 'windows1256';
}
