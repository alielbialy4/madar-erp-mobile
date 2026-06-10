import Reshaper from 'arabic-persian-reshaper';
import type { EscPosEncoding } from '@/types/printing';
import { applyBidiVisualOrder } from './arabicBidi';

const ARABIC_SEGMENT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;
const LATIN_DIGIT = /[A-Za-z0-9]/;

/**
 * Contextual Arabic shaping (initial/medial/final/isolated) via presentation forms.
 * Use for CP864 — Windows-1256 encodes logical U+06xx and must NOT use FE8x forms.
 */
export function reshapeArabicSegment(text: string): string {
  if (!text) return text;
  try {
    return Reshaper.ArabicShaper.convertArabic(text);
  } catch {
    return text;
  }
}

export function prepareArabicLine(line: string): string {
  if (!line) return line;
  return line.replace(ARABIC_SEGMENT, (segment) => reshapeArabicSegment(segment));
}

/** CP864 pipeline: contextual shaping only (logical order). */
export function prepareArabicText(text: string): string {
  return text
    .split('\n')
    .map((row) => prepareArabicLine(row))
    .join('\n');
}

/**
 * BiDi visual reorder for LTR-only thermal firmware (after any shaping).
 * Keeps Latin digits in correct visual positions on mixed lines.
 */
export function applyPrinterVisualOrder(line: string, baseDirection: 'rtl' | 'ltr' = 'rtl'): string {
  if (!line) return line;
  return applyBidiVisualOrder(line, baseDirection);
}

/**
 * Full CP864 fast-text pipeline: reshape presentation forms + BiDi visual order per line.
 */
export function prepareArabicTextForPrinter(text: string): string {
  return text
    .split('\n')
    .map((row) => applyPrinterVisualOrder(prepareArabicLine(row), 'rtl'))
    .join('\n');
}

/**
 * Encoding-aware Arabic preparation before SBCS byte mapping.
 *
 * - windows1256 / cp720: logical Arabic + BiDi (printer ROM connects letters on CP17/22).
 * - cp864: reshaped presentation forms + BiDi (byte map stores FE8x glyphs).
 */
export function prepareArabicTextForEncoding(text: string, encoding: EscPosEncoding): string {
  if (encoding === 'utf8' || encoding === 'utf8_image') return text;

  if (encoding === 'windows1256' || encoding === 'cp720') {
    return text
      .split('\n')
      .map((row) => applyPrinterVisualOrder(row, 'rtl'))
      .join('\n');
  }

  if (encoding === 'cp864') {
    return prepareArabicTextForPrinter(text);
  }

  return text;
}

export function lineHasLatinDigits(text: string): boolean {
  return LATIN_DIGIT.test(text);
}
