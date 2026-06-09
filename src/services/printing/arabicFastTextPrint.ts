import type { EscPosEncoding } from '@/types/printing';
import { EscPosBuilder, charsForPaper } from './escposBuilder';
import { THERMAL_ARABIC_SELF_TEST_TABLE } from './codePageTables';
import type { PaperWidth } from '@/types/printing';

/** SBCS encodings supported for ultra-fast Arabic text printing. */
export type FastArabicEncoding = 'cp864' | 'windows1256';

export type FastArabicTextPrintOptions = {
  encoding?: FastArabicEncoding;
  /** ESC t n table number — defaults from THERMAL_ARABIC_SELF_TEST_TABLE. */
  codePageTableNumber?: number;
  align?: 'left' | 'center' | 'right';
  paperWidth?: PaperWidth;
  cut?: boolean;
  feedLines?: number;
};

const ESC = 0x1b;

/**
 * Raw ESC/POS command: ESC t n — select character code table.
 * CP22 (PC864): [0x1B, 0x74, 0x16]
 * CP17 (Arabic): [0x1B, 0x74, 0x11]
 */
export function escPosSelectCodePageCommand(tableNumber: number): Uint8Array {
  return Uint8Array.from([ESC, 0x74, tableNumber & 0xff]);
}

function resolveCodePageNumber(encoding: FastArabicEncoding, override?: number): number {
  if (override != null) return override & 0xff;
  return encoding === 'cp864'
    ? THERMAL_ARABIC_SELF_TEST_TABLE.cp864
    : THERMAL_ARABIC_SELF_TEST_TABLE.windows1256;
}

/**
 * Builds a complete ESC/POS buffer from raw Arabic text:
 * init → align → (ESC t n + shaped/BiDi-encoded bytes + LF)* → feed → cut
 *
 * Shaping + BiDi + SBCS encoding happen inside EscPosBuilder.textLine via encodeForPrinter.
 */
export function buildFastArabicTextBuffer(
  rawArabicText: string,
  options: FastArabicTextPrintOptions = {},
): Uint8Array {
  const encoding: EscPosEncoding = options.encoding ?? 'windows1256';
  const paperWidth = options.paperWidth ?? '80mm';
  const cols = charsForPaper(paperWidth);
  const tableNumber = resolveCodePageNumber(encoding, options.codePageTableNumber);

  const table = {
    ...THERMAL_ARABIC_SELF_TEST_TABLE,
    ...(encoding === 'cp864' ? { cp864: tableNumber } : { windows1256: tableNumber }),
  };

  const b = new EscPosBuilder({ codePageTable: table });
  b.init().align(options.align ?? 'right');

  const lines = rawArabicText.split('\n');
  for (const line of lines) {
    b.textLine(line, cols, encoding);
  }

  b.feed(options.feedLines ?? 3);
  if (options.cut !== false) b.cut();

  return b.build();
}

/**
 * Ultra-fast Arabic text print over TCP :9100 — no bitmap capture.
 *
 * @example
 * await printArabicTextFast('192.168.1.100', 9100, 'فاتورة بيع\nالإجمالي: 150.00 ج.م');
 */
export async function printArabicTextFast(
  ip: string,
  port: number,
  rawArabicText: string,
  options: FastArabicTextPrintOptions = {},
): Promise<void> {
  const buffer = buildFastArabicTextBuffer(rawArabicText, options);
  const { sendEscPosOverTcp } = await import('./networkTcpPrinter');
  await sendEscPosOverTcp(ip, port, buffer);
}
