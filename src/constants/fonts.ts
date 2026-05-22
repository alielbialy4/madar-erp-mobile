/** Matches front/public/index.html — Tajawal from Google Fonts */
export const fonts = {
  regular: 'Tajawal_400Regular',
  medium: 'Tajawal_500Medium',
  bold: 'Tajawal_700Bold',
  extraBold: 'Tajawal_800ExtraBold',
  black: 'Tajawal_900Black',
} as const;

export type FontWeightKey = keyof typeof fonts;

const NAMED_WEIGHTS: Record<string, number> = {
  normal: 400,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

function parseWeight(fontWeight?: string | number): number | undefined {
  if (fontWeight == null) return undefined;
  if (typeof fontWeight === 'number') return fontWeight;
  const named = NAMED_WEIGHTS[fontWeight.toLowerCase()];
  if (named != null) return named;
  const parsed = parseInt(fontWeight, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** Map React Native fontWeight to Tajawal family (web uses Tajawal 500/700/800). */
export function fontFamilyForWeight(fontWeight?: string | number): string {
  const w = parseWeight(fontWeight);
  if (w == null) return fonts.medium;
  if (w >= 900) return fonts.black;
  if (w >= 800) return fonts.extraBold;
  if (w >= 700) return fonts.bold;
  if (w >= 500) return fonts.medium;
  return fonts.regular;
}

export function appFont(weight: FontWeightKey = 'medium') {
  return { fontFamily: fonts[weight] };
}
