export type ReceiptPrintMode = 'quality_image' | 'fast_text';

export const DEFAULT_RECEIPT_PRINT_MODE: ReceiptPrintMode = 'quality_image';

export function normalizeReceiptPrintMode(raw: unknown): ReceiptPrintMode {
  return raw === 'fast_text' ? 'fast_text' : DEFAULT_RECEIPT_PRINT_MODE;
}
