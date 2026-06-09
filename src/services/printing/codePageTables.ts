import type { PrinterProfile } from '@/types/printing';

export type CodePagePreset = 'epson' | 'generic_clone';

export type CodePageTable = {
  cp864: number;
  cp720: number;
  windows1256: number;
};

/** Epson TM / standard ESC/POS tables (PC864 = page 37). */
export const EPSON_CODE_PAGE_TABLE: CodePageTable = {
  cp864: 37,
  cp720: 32,
  windows1256: 50,
};

/** Common Xprinter / clone firmware (CP864 sometimes on page 22). */
export const CLONE_CODE_PAGE_TABLE: CodePageTable = {
  cp864: 22,
  cp720: 32,
  windows1256: 50,
};

export const CODE_PAGE_PRESETS: Record<CodePagePreset, CodePageTable> = {
  epson: EPSON_CODE_PAGE_TABLE,
  generic_clone: CLONE_CODE_PAGE_TABLE,
};

export function resolveCodePageTable(
  profile?: Pick<PrinterProfile, 'code_page_preset' | 'code_page_table'> | null,
): CodePageTable {
  const preset = profile?.code_page_preset ?? 'generic_clone';
  const base = CODE_PAGE_PRESETS[preset] ?? EPSON_CODE_PAGE_TABLE;
  const overrides = profile?.code_page_table;
  if (!overrides) return base;
  return {
    cp864: overrides.cp864 ?? base.cp864,
    cp720: overrides.cp720 ?? base.cp720,
    windows1256: overrides.windows1256 ?? base.windows1256,
  };
}
