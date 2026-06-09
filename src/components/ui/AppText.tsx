import React from 'react';
import { Platform, StyleSheet, Text as RNText, TextProps, TextStyle, type StyleProp } from 'react-native';
import { textAlignEnd, textAlignStart, textCenter, textLtr } from '@/constants/layout';
import { resolveTajawalFontOnly } from '@/constants/fonts';

type TextAlignProp = 'start' | 'end' | 'center';

type AppTextProps = TextProps & {
  numeric?: boolean;
  align?: TextAlignProp;
};

function alignmentForProp(align: TextAlignProp): TextStyle {
  switch (align) {
    case 'center':
      return textCenter;
    case 'end':
      return textAlignEnd;
    default:
      return textAlignStart;
  }
}

export function AppText({ style, numeric, align, ...props }: AppTextProps) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontStyle = resolveTajawalFontOnly(style as StyleProp<TextStyle>);

  const writingDirection =
    flat?.writingDirection ?? (numeric ? 'ltr' : 'rtl');

  const trailingStyle: TextStyle | undefined = (() => {
    if (align != null) return alignmentForProp(align);
    if (numeric) return flat?.textAlign == null ? textLtr : undefined;
    if (flat?.textAlign === 'center') return undefined;
    return textAlignStart;
  })();

  const webNumericAttrs =
    Platform.OS === 'web' && numeric
      ? ({ dataSet: { numeric: 'true' } } as TextProps)
      : undefined;

  return (
    <RNText
      {...props}
      {...webNumericAttrs}
      style={[fontStyle, { writingDirection }, trailingStyle]}
    />
  );
}

export const Text = AppText;

export { fonts as appFonts } from '@/constants/fonts';
