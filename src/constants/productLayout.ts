export type ProductLayoutTier = 'compactPhone' | 'phone' | 'largePhone' | 'tablet' | 'largeTablet';
export type ProductDensity = 'comfortable' | 'standard' | 'dense';

export function getProductLayoutTier(width: number): ProductLayoutTier {
  if (width < 375) return 'compactPhone';
  if (width < 420) return 'phone';
  if (width < 600) return 'largePhone';
  if (width < 1024) return 'tablet';
  return 'largeTablet';
}

export function isProductTablet(tier: ProductLayoutTier): boolean {
  return tier === 'tablet' || tier === 'largeTablet';
}

export function productContentMaxWidth(tier: ProductLayoutTier): number | undefined {
  if (tier === 'largeTablet') return 1180;
  if (tier === 'tablet') return 920;
  return undefined;
}
