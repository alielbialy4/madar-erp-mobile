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

/**
 * Primary ESC t n for Windows-1256 Arabic on Rongta / Xprinter / Epson-clone firmware.
 * Command bytes: [0x1B, 0x40] then [0x1B, 0x74, 22]
 *
 * If Arabic prints as PC437 box glyphs (π, µ, ╟), swap n to one of:
 *   WINDOWS1256_ESC_T_FALLBACKS → 42, 50, 70, 72
 */
export const ARABIC_WINDOWS1256_CODE_PAGE = 22;

/** Alternate ESC t n values when primary (22) does not match firmware. */
export const WINDOWS1256_ESC_T_FALLBACKS = [42, 50, 70, 72] as const;

/** Legacy label on some self-test slips (CP17 = 0x11) — kept for diagnostics sweep only. */
export const ARABIC_SELF_TEST_CP17 = 17;

/** Arabic code pages from printer self-test (use for sweep / diagnostics). */
export const ARABIC_SELF_TEST_CODE_PAGES = {
  arabic: ARABIC_SELF_TEST_CP17,
  pc864: 22,
  ansi1256: 106,
  ibm20420: 128,
  iso28596: 147,
  mac10004: 155,
  oem864: 178,
} as const;

/** W1256-byte encodings — try these ESC t values with encoding `windows1256`. */
export const WINDOWS1256_CODE_PAGE_CANDIDATES = [
  ARABIC_SELF_TEST_CODE_PAGES.arabic,
  ARABIC_SELF_TEST_CODE_PAGES.ansi1256,
  ARABIC_SELF_TEST_CODE_PAGES.ibm20420,
  ARABIC_SELF_TEST_CODE_PAGES.iso28596,
  ARABIC_SELF_TEST_CODE_PAGES.mac10004,
] as const;

/** CP864-byte encodings — try these ESC t values with encoding `cp864`. */
export const CP864_CODE_PAGE_CANDIDATES = [
  ARABIC_SELF_TEST_CODE_PAGES.pc864,
  ARABIC_SELF_TEST_CODE_PAGES.oem864,
  37,
] as const;

/** Common Xprinter / clone firmware. */
export const CLONE_CODE_PAGE_TABLE: CodePageTable = {
  cp864: 22,
  cp720: 32,
  windows1256: ARABIC_WINDOWS1256_CODE_PAGE,
};

/**
 * Default Arabic text tables for fast_text checkout (TCP instant print).
 * Override per printer in profile advanced settings if self-test differs.
 */
export const THERMAL_ARABIC_SELF_TEST_TABLE: CodePageTable = {
  cp864: 22,
  cp720: 32,
  windows1256: ARABIC_WINDOWS1256_CODE_PAGE,
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
