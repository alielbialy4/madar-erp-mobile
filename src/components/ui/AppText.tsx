import React from 'react';
import { StyleSheet, Text as RNText, TextProps, TextStyle, type StyleProp } from 'react-native';
import { textStart } from '@/constants/layout';
import { fonts, resolveTajawalStyle } from '@/constants/fonts';

export function AppText({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const hasAlign = flat?.textAlign != null;
  const resolved = resolveTajawalStyle(style as StyleProp<TextStyle>);

  return (
    <RNText
      {...props}
      style={[!hasAlign ? textStart : undefined, resolved]}
    />
  );
}

/** Use instead of react-native Text so Tajawal is always applied */
export const Text = AppText;

export { fonts as appFonts } from '@/constants/fonts';
