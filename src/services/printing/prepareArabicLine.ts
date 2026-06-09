import Reshaper from 'arabic-persian-reshaper';
import { applyBidiVisualOrder } from './arabicBidi';

const ARABIC_SEGMENT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;
const LATIN_DIGIT = /[A-Za-z0-9]/;

/**
 * Applies contextual Arabic shaping (initial/medial/final) before single-byte encoding.
 * Does not reverse characters — avoids the broken split('').reverse() workaround.
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

/** Mixed Arabic + Latin: reshape Arabic runs only (logical order). */
export function prepareArabicText(text: string): string {
  return text
    .split('\n')
    .map((row) => prepareArabicLine(row))
    .join('\n');
}

/**
 * Full fast-text pipeline: contextual shaping + BiDi visual order per line.
 * Use before SBCS encoding (cp864 / windows-1256).
 */
export function prepareArabicTextForPrinter(text: string): string {
  return text
    .split('\n')
    .map((row) => applyBidiVisualOrder(prepareArabicLine(row), 'rtl'))
    .join('\n');
}

export function lineHasLatinDigits(text: string): boolean {
  return LATIN_DIGIT.test(text);
}
