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
