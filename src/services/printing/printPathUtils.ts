import type { EscPosEncoding, PrinterProfile } from '@/types/printing';

export function usesRasterEncoding(profile: PrinterProfile): boolean {
  return profile.encoding === 'utf8_image' || profile.mode === 'escpos_image';
}

/** Map legacy encodings to the two supported production modes. */
export function normalizeFormEncoding(enc: EscPosEncoding): EscPosEncoding {
  return enc === 'utf8_image' ? 'utf8_image' : 'windows1256';
}
