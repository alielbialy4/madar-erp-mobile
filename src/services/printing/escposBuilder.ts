import type { EscPosEncoding, PaperWidth } from '@/types/printing';

const ESC = 0x1b;
const GS = 0x1d;

export class EscPosBuilder {
  private chunks: number[] = [];

  init(): this {
    this.chunks.push(ESC, 0x40);
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
    if (encoding === 'cp864') this.chunks.push(ESC, 0x74, 22);
    else if (encoding === 'cp720') this.chunks.push(ESC, 0x74, 32);
    else if (encoding === 'windows1256') this.chunks.push(ESC, 0x74, 50);
    return this;
  }

  textLine(line: string, charsPerLine: number): this {
    const wrapped = wrapText(line, charsPerLine);
    for (const row of wrapped) {
      this.chunks.push(...encodeLatin1(row), 0x0a);
    }
    return this;
  }

  separator(charsPerLine: number, char = '-'): this {
    return this.textLine(char.repeat(charsPerLine), charsPerLine);
  }

  feed(lines = 3): this {
    for (let i = 0; i < lines; i += 1) this.chunks.push(0x0a);
    return this;
  }

  cut(partial = false): this {
    this.chunks.push(GS, 0x56, partial ? 1 : 0);
    return this;
  }

  build(): Uint8Array {
    return Uint8Array.from(this.chunks);
  }
}

function wrapText(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= max) current = next;
    else {
      if (current) lines.push(current);
      current = word.length > max ? word.slice(0, max) : word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function encodeLatin1(text: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    out.push(code <= 0xff ? code : 0x3f);
  }
  return out;
}

export function charsForPaper(width: PaperWidth): number {
  return width === '58mm' ? 32 : 48;
}
