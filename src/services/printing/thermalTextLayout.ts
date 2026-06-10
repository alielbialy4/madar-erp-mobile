import { prepareArabicTextForEncoding } from './prepareArabicLine';
import type { EscPosEncoding } from '@/types/printing';

/** Monospace cell count for thermal line layout (one code point ≈ one column). */
export function thermalCellCount(text: string): number {
  return [...text].length;
}

/**
 * Two-column line: `left` and `right` padded with ASCII spaces to exactly `cols` cells.
 * Pass logical Arabic; shaping/BiDi runs before encoding in EscPosBuilder.
 */
export function formatTwoColumnLine(left: string, right: string, cols: number): string {
  const leftCells = thermalCellCount(left);
  const rightCells = thermalCellCount(right);
  if (leftCells + rightCells >= cols) {
    const maxLeft = Math.max(1, cols - rightCells - 1);
    const trimmedLeft = [...left].slice(0, maxLeft).join('');
    const gap = Math.max(1, cols - thermalCellCount(trimmedLeft) - rightCells);
    return `${trimmedLeft}${' '.repeat(gap)}${right}`;
  }
  const gap = cols - leftCells - rightCells;
  return `${left}${' '.repeat(gap)}${right}`;
}

/** Item row: name × qty on the right column side, price on the left (RTL visual). */
export function formatReceiptItemLine(
  name: string,
  quantity: number,
  priceLabel: string,
  cols: number,
): string {
  return formatTwoColumnLine(priceLabel, `${name} x${quantity}`, cols);
}

/** Prepare a full receipt line for SBCS thermal output (shape + BiDi when needed). */
export function prepareThermalLine(line: string, encoding: EscPosEncoding): string {
  return prepareArabicTextForEncoding(line, encoding);
}
