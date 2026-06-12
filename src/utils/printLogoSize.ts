export const LOGO_SCALE_MIN = 50;
export const LOGO_SCALE_MAX = 200;
export const DEFAULT_LOGO_SCALE = 100;

export type ReceiptPaperWidth = '58mm' | '80mm';

const BASE_LOGO_80MM = { maxWidth: 100, maxHeight: 48 };
const BASE_LOGO_58MM = { maxWidth: 90, maxHeight: 40 };

/** Clamp branch receipt logo scale to a safe integer percent (50–200). */
export function clampLogoScale(value: unknown): number {
  if (value === undefined || value === null || value === '') return DEFAULT_LOGO_SCALE;
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (!Number.isFinite(n)) return DEFAULT_LOGO_SCALE;
  return Math.max(LOGO_SCALE_MIN, Math.min(LOGO_SCALE_MAX, Math.round(n)));
}

export function isLogoScaleInRange(value: number): boolean {
  return Number.isFinite(value) && value >= LOGO_SCALE_MIN && value <= LOGO_SCALE_MAX;
}

export function resolveLogoMaxDimensions(
  paperWidth: ReceiptPaperWidth | undefined,
  scalePercent: unknown,
): { maxWidth: number; maxHeight: number } {
  const scale = clampLogoScale(scalePercent);
  const base = paperWidth === '58mm' ? BASE_LOGO_58MM : BASE_LOGO_80MM;
  const factor = scale / 100;
  return {
    maxWidth: Math.round(base.maxWidth * factor),
    maxHeight: Math.round(base.maxHeight * factor),
  };
}
