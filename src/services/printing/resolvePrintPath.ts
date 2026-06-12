import type { PrinterProfile } from '@/types/printing';
import type { ReceiptPrintMode } from '@/utils/branchPrintSettings';
import { DEFAULT_RECEIPT_PRINT_MODE } from '@/utils/branchPrintSettings';
import { THERMAL_ARABIC_SELF_TEST_TABLE } from './codePageTables';
import { usesRasterEncoding } from './printPathUtils';

export type { ReceiptPrintMode };

export function coerceReceiptPrintMode(mode: ReceiptPrintMode): ReceiptPrintMode {
  return mode;
}

export function normalizeReceiptPrintMode(raw: unknown): ReceiptPrintMode {
  return raw === 'fast_text' ? 'fast_text' : DEFAULT_RECEIPT_PRINT_MODE;
}

/** Applies branch speed mode to the cashier profile used for buffer building. */
export function effectiveReceiptProfile(profile: PrinterProfile, mode: ReceiptPrintMode): PrinterProfile {
  if (coerceReceiptPrintMode(mode) !== 'fast_text') return profile;
  return {
    ...profile,
    encoding: 'windows1256',
    mode: 'escpos_text',
    code_page_preset: profile.code_page_preset ?? 'generic_clone',
    code_page_table: {
      ...THERMAL_ARABIC_SELF_TEST_TABLE,
      ...profile.code_page_table,
    },
  };
}

export function shouldUseRasterForReceipt(profile: PrinterProfile, mode: ReceiptPrintMode): boolean {
  if (coerceReceiptPrintMode(mode) === 'fast_text') return false;
  return usesRasterEncoding(profile);
}

export function receiptPrintPathForMode(mode: ReceiptPrintMode): 'raster' | 'text_windows1256' {
  return coerceReceiptPrintMode(mode) === 'fast_text' ? 'text_windows1256' : 'raster';
}
