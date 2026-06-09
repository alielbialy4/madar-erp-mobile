import type { PaperWidth } from '@/types/printing';
import { dotsForPaper } from '@/services/printing/escposRaster';

export const THERMAL_HORIZONTAL_PADDING_MM = 2.5;
export const THERMAL_PAGE_MM_80 = 72;
export const THERMAL_PAGE_MM_58 = 58;

/** Column width ratios for receipt items table (product / qty / price / total). */
export const RECEIPT_COL_RATIOS = [0.4, 0.1, 0.24, 0.26] as const;

export function thermalContentWidthPx(paperWidth: PaperWidth): number {
  return dotsForPaper(paperWidth);
}

export function thermalPaddingPx(paperWidth: PaperWidth): number {
  // 2.5mm horizontal padding on 80mm (~576 dots / 72mm ≈ 8 dots/mm → 20px)
  // 2mm on 58mm (~384 dots / 58mm ≈ 6.6 dots/mm → 13px)
  return paperWidth === '58mm' ? 13 : 20;
}

export function receiptColumnWidths(contentWidth: number, padding: number): number[] {
  const inner = contentWidth - padding * 2;
  return RECEIPT_COL_RATIOS.map((ratio) => Math.floor(inner * ratio));
}

/** @deprecated Use logoMaxWidth(paperWidth) */
export const LOGO_MAX_WIDTH = 100;
/** @deprecated Use logoMaxHeight(paperWidth) */
export const LOGO_MAX_HEIGHT = 48;

export function logoMaxWidth(paperWidth: PaperWidth): number {
  return paperWidth === '58mm' ? 90 : 100;
}

export function logoMaxHeight(paperWidth: PaperWidth): number {
  return paperWidth === '58mm' ? 40 : 48;
}
