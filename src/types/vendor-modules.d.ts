declare module 'upng-js' {
  const UPNG: {
    decode: (buffer: ArrayBuffer) => { width: number; height: number; data: ArrayBuffer };
    toRGBA8: (img: { width: number; height: number; data: ArrayBuffer }) => ArrayBuffer[];
    encode: (
      imgs: ArrayBuffer[],
      w: number,
      h: number,
      cnum: number,
      dels?: number[],
    ) => ArrayBuffer;
  };
  export default UPNG;
}

declare module 'arabic-persian-reshaper' {
  const Reshaper: {
    ArabicShaper: {
      convertArabic: (text: string) => string;
    };
  };
  export default Reshaper;
}

declare module 'bidi-js' {
  type EmbeddingLevels = {
    levels: number[];
  };

  type BidiInstance = {
    getEmbeddingLevels: (text: string, baseDirection: 'ltr' | 'rtl') => EmbeddingLevels;
    getReorderSegments: (
      text: string,
      embeddingLevels: EmbeddingLevels,
      lineStart?: number,
      lineEnd?: number,
    ) => Array<[number, number]>;
    getMirroredCharactersMap: (
      text: string,
      embeddingLevels: EmbeddingLevels,
      lineStart?: number,
      lineEnd?: number,
    ) => Map<number, string>;
  };

  export default function bidiFactory(): BidiInstance;
}
