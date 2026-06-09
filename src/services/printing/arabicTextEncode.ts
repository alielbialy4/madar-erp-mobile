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
 * Encode receipt text for ESC/POS according to profile encoding.
 * Pure-JS SBCS tables — no Node iconv-lite (React Native safe).
 */
export function encodeForPrinter(text: string, encoding: EscPosEncoding, shapeArabic = true): Uint8Array {
  const source = shapeArabic && encoding !== 'utf8' && encoding !== 'utf8_image'
    ? prepareArabicText(text)
    : text;

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
