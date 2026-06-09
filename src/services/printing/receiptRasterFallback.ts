import type { EscPosEncoding, PrinterProfile } from '@/types/printing';
import type { ReceiptPrintPath } from './printDiagnostics';

export function usesRasterEncoding(profile: PrinterProfile): boolean {
  return profile.encoding === 'utf8_image' || profile.mode === 'escpos_image';
}

export type TextFallbackStep = {
  path: ReceiptPrintPath;
  encoding: EscPosEncoding;
  code_page_preset: PrinterProfile['code_page_preset'];
};

/** Graduated text fallback: cp864/clone first (escpos-coffee #44), then W1256/Epson. */
export const TEXT_FALLBACK_STEPS: TextFallbackStep[] = [
  { path: 'text_cp864_clone', encoding: 'cp864', code_page_preset: 'generic_clone' },
  { path: 'text_windows1256', encoding: 'windows1256', code_page_preset: 'epson' },
  { path: 'text_cp864_epson', encoding: 'cp864', code_page_preset: 'epson' },
];

const TEXT_ENCODINGS: EscPosEncoding[] = ['cp864', 'windows1256', 'cp720'];

/** Prefer profile text settings when user chose cp864/windows1256; else default clone cp864. */
export function pickFallbackStep(profile: PrinterProfile): TextFallbackStep {
  if (TEXT_ENCODINGS.includes(profile.encoding) && profile.mode !== 'escpos_image') {
    const preset = profile.code_page_preset ?? 'generic_clone';
    if (profile.encoding === 'cp864') {
      return {
        path: preset === 'epson' ? 'text_cp864_epson' : 'text_cp864_clone',
        encoding: 'cp864',
        code_page_preset: preset,
      };
    }
    if (profile.encoding === 'windows1256') {
      return {
        path: 'text_windows1256',
        encoding: 'windows1256',
        code_page_preset: preset,
      };
    }
    return {
      path: 'text_cp864_clone',
      encoding: profile.encoding,
      code_page_preset: preset,
    };
  }
  return TEXT_FALLBACK_STEPS[0];
}
