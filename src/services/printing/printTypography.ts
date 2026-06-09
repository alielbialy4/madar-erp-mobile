export const PRINT_FONT_SIZE_MIN = 10;
export const PRINT_FONT_SIZE_MAX = 22;
export const DEFAULT_CUSTOMER_RECEIPT_FONT_SIZE = 12;
export const DEFAULT_KITCHEN_TICKET_FONT_SIZE = 13;
export const DEFAULT_SHIFT_CLOSE_FONT_SIZE = 12;

export const THERMAL_READABILITY_SCALE = 0.95;

const RECEIPT_CSS_BASE = 12;
const KITCHEN_CSS_BASE = 13;

export type PrintFontKind = 'customer' | 'kitchen' | 'shift';

function defaultFor(kind: PrintFontKind): number {
  if (kind === 'kitchen') return DEFAULT_KITCHEN_TICKET_FONT_SIZE;
  if (kind === 'shift') return DEFAULT_SHIFT_CLOSE_FONT_SIZE;
  return DEFAULT_CUSTOMER_RECEIPT_FONT_SIZE;
}

export function clampPrintFontSize(value: unknown, kind: PrintFontKind = 'customer'): number {
  const fallback = defaultFor(kind);
  if (value === undefined || value === null || value === '') return fallback;
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(PRINT_FONT_SIZE_MIN, Math.min(PRINT_FONT_SIZE_MAX, Math.round(n)));
}

export function scaleReceiptCssPx(basePx: number, fontSizePx: number): number {
  const safe = clampPrintFontSize(fontSizePx, 'customer');
  return Math.round(((basePx * safe) / RECEIPT_CSS_BASE) * 10) / 10;
}

export function scaleKitchenCssPx(basePx: number, fontSizePx: number): number {
  const safe = clampPrintFontSize(fontSizePx, 'kitchen');
  return Math.round(((basePx * safe * THERMAL_READABILITY_SCALE) / KITCHEN_CSS_BASE) * 10) / 10;
}

export function scaleShiftCssPx(basePx: number, fontSizePx: number): number {
  const safe = clampPrintFontSize(fontSizePx, 'shift');
  return Math.round(((basePx * safe * THERMAL_READABILITY_SCALE) / RECEIPT_CSS_BASE) * 10) / 10;
}

export function isPrintFontSizeInRange(value: number): boolean {
  return Number.isFinite(value) && value >= PRINT_FONT_SIZE_MIN && value <= PRINT_FONT_SIZE_MAX;
}
