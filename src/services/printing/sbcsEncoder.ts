import { CHARSET_TABLES } from './charsetTables';

const DEFAULT_BYTE = 0x3f; // '?'

function normalizeChars(chars: string): string {
  if (chars.length === 128) {
    let ascii = '';
    for (let i = 0; i < 128; i += 1) ascii += String.fromCharCode(i);
    return ascii + chars;
  }
  return chars;
}

function buildEncodeMap(chars: string): Uint16Array {
  const full = normalizeChars(chars);
  const map = new Uint16Array(65536);
  map.fill(DEFAULT_BYTE);
  for (let i = 0; i < full.length; i += 1) {
    map[full.charCodeAt(i)] = i;
  }
  return map;
}

const ENCODE_MAPS = {
  windows1256: buildEncodeMap(CHARSET_TABLES.windows1256),
  cp864: buildEncodeMap(CHARSET_TABLES.cp864),
  cp720: buildEncodeMap(CHARSET_TABLES.cp720),
} as const;

// A few CP864 firmware tables omit medial presentation forms even though they
// contain the same letters in isolated/initial forms. Fall back to a supported
// glyph instead of emitting `?` for Arabic receipts.
const CP864_PRESENTATION_FALLBACKS: Record<number, number> = {
  0xfe92: 0xfe91, // beh medial -> beh isolated
  0xfe98: 0xfe97, // teh medial -> teh initial
};

export type SbcsCharset = keyof typeof ENCODE_MAPS;

export function encodeSbcs(text: string, charset: SbcsCharset): Uint8Array {
  const map = ENCODE_MAPS[charset];
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    const fallbackCode = charset === 'cp864' ? CP864_PRESENTATION_FALLBACKS[code] : undefined;
    out[i] = map[code] !== DEFAULT_BYTE ? map[code] : fallbackCode != null ? map[fallbackCode] : DEFAULT_BYTE;
  }
  return out;
}
