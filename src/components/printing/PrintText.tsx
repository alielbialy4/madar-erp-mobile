import { designColors } from '@/constants/colors';
import React from 'react';
import { StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native';
import { textAlignStart, textLtr } from '@/constants/layout';

type PrintTextProps = TextProps & {
  numeric?: boolean;
};

/** Thermal print text — system font only (no Tajawal). */
export function PrintText({ style, numeric, ...props }: PrintTextProps) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const trailingStyle: TextStyle | undefined = (() => {
    if (numeric) return flat?.textAlign == null ? textLtr : undefined;
    if (flat?.textAlign === 'center') return undefined;
    return textAlignStart;
  })();

  return (
    <RNText
      {...props}
      style={[
        {
          color: designColors.black,
          fontWeight: flat?.fontWeight ?? '400',
        },
        flat,
        { writingDirection: flat?.writingDirection ?? (numeric ? 'ltr' : 'rtl') },
        trailingStyle,
      ]}
    />
  );
}
