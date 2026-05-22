import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { BRAND_LOGO, BRAND_LOGO_ASPECT } from '@/constants/brandAssets';

type Props = {
  /** Height in px; width follows logo aspect ratio unless `width` is set. */
  height?: number;
  width?: number;
  /** White logo on dark backgrounds (matches web `brightness-0 invert`). */
  inverted?: boolean;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

export function BrandLogo({
  height = 56,
  width,
  inverted = false,
  style,
  accessibilityLabel = 'شعار مدار',
}: Props) {
  const resolvedWidth = width ?? Math.round(height * BRAND_LOGO_ASPECT);

  return (
    <Image
      source={BRAND_LOGO}
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      style={[
        { width: resolvedWidth, height },
        inverted ? { tintColor: '#FFFFFF' } : undefined,
        style,
      ]}
    />
  );
}
