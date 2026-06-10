import type { EscPosEncoding, PaperWidth, PrinterProfile } from '@/types/printing';
import { encodeForPrinter } from './arabicTextEncode';
import { resolveCodePageTable, type CodePageTable } from './codePageTables';
import { thermalCellCount } from './thermalTextLayout';

const ESC = 0x1b;
const GS = 0x1d;

export type EscPosBuilderOptions = {
  codePageTable?: CodePageTable;
};

export class EscPosBuilder {
  private chunks: number[] = [];
  private readonly codePageTable: CodePageTable;
  private activeSbcsEncoding: EscPosEncoding | null = null;

  constructor(options?: EscPosBuilderOptions) {
    this.codePageTable = options?.codePageTable ?? resolveCodePageTable();
  }

  static forProfile(profile: Pick<PrinterProfile, 'code_page_preset' | 'code_page_table'>): EscPosBuilder {
    return new EscPosBuilder({ codePageTable: resolveCodePageTable(profile) });
  }

  init(): this {
    this.chunks.push(ESC, 0x40);
    return this;
  }

  /**
   * ESC @ (init) then ESC t n before any Arabic SBCS bytes.
   * W1256 default n=22 — see ARABIC_WINDOWS1256_CODE_PAGE / WINDOWS1256_ESC_T_FALLBACKS.
   */
  initArabicTextSession(encoding: EscPosEncoding = 'windows1256'): this {
    this.chunks.push(ESC, 0x40);
    this.codePage(encoding);
    return this;
  }

  align(mode: 'left' | 'center' | 'right'): this {
    const n = mode === 'left' ? 0 : mode === 'center' ? 1 : 2;
    this.chunks.push(ESC, 0x61, n);
    return this;
  }

  bold(on = true): this {
    this.chunks.push(ESC, 0x45, on ? 1 : 0);
    return this;
  }

  size(doubleWidth = false, doubleHeight = false): this {
    const n = (doubleWidth ? 0x10 : 0) | (doubleHeight ? 0x01 : 0);
    this.chunks.push(GS, 0x21, n);
    return this;
  }

  codePage(encoding: EscPosEncoding): this {
    if (encoding === 'utf8' || encoding === 'utf8_image') return this;
    const table = this.codePageTable;
    if (encoding === 'cp864') this.chunks.push(ESC, 0x74, table.cp864);
    else if (encoding === 'cp720') this.chunks.push(ESC, 0x74, table.cp720);
    else if (encoding === 'windows1256') this.chunks.push(ESC, 0x74, table.windows1256);
    this.activeSbcsEncoding = encoding;
    return this;
  }

  /** Raw ESC t n — for code page diagnostic prints. */
  selectCodePageTable(tableNumber: number): this {
    this.chunks.push(ESC, 0x74, tableNumber & 0xff);
    return this;
  }

  textLine(line: string, charsPerLine: number, encoding: EscPosEncoding = 'utf8'): this {
    const wrapped = wrapText(line, charsPerLine);
    const needsCodePageReselect =
      encoding === 'cp864' || encoding === 'cp720' || encoding === 'windows1256';
    for (const row of wrapped) {
      if (needsCodePageReselect) this.codePage(encoding);
      this.appendEncodedLine(row, encoding);
    }
    return this;
  }

  /**
   * Append wrapped text without ESC t — use after selectCodePageTable() in diagnostics.
   */
  textLinePreservingCodePage(
    line: string,
    charsPerLine: number,
    encoding: EscPosEncoding = 'utf8',
  ): this {
    const wrapped = wrapText(line, charsPerLine);
    for (const row of wrapped) {
      this.appendEncodedLine(row, encoding);
    }
    return this;
  }

  private appendEncodedLine(row: string, encoding: EscPosEncoding): void {
    const bytes = encodeForPrinter(row, encoding);
    this.chunks.push(...bytes, 0x0a);
  }

  separator(charsPerLine: number, char = '-'): this {
    const line = char.repeat(charsPerLine);
    if (this.activeSbcsEncoding) {
      this.codePage(this.activeSbcsEncoding);
      this.appendEncodedLine(line, this.activeSbcsEncoding);
      return this;
    }
    return this.textLine(line, charsPerLine, 'utf8');
  }

  feed(lines = 3): this {
    for (let i = 0; i < lines; i += 1) this.chunks.push(0x0a);
    return this;
  }

  cut(partial = false): this {
    this.chunks.push(GS, 0x56, partial ? 1 : 0);
    return this;
  }

  /** GS p m t1 t2 — Epson standard cash drawer kick */
  pulseDrawer(pin = 0, onMs = 50, offMs = 250): this {
    this.chunks.push(GS, 0x70, pin, onMs, offMs);
    return this;
  }

  build(): Uint8Array {
    return Uint8Array.from(this.chunks);
  }
}

function wrapText(text: string, max: number): string[] {
  if (max <= 0) return [''];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let current = '';

  const pushLongToken = (token: string) => {
    const chars = [...token];
    while (chars.length > max) {
      lines.push(chars.splice(0, max).join(''));
    }
    if (chars.length) lines.push(chars.join(''));
  };

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (thermalCellCount(next) <= max) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    if (thermalCellCount(word) > max) {
      pushLongToken(word);
      current = '';
    } else {
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

export function charsForPaper(width: PaperWidth): number {
  return width === '58mm' ? 32 : 48;
}
