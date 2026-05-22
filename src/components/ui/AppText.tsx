import React from 'react';
import { StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native';
import { textStart } from '@/constants/layout';
import { fontFamilyForWeight } from '@/constants/fonts';

export function AppText({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontFamily = flat?.fontFamily ?? fontFamilyForWeight(flat?.fontWeight);
  const hasAlign = flat?.textAlign != null;
  return (
    <RNText
      {...props}
      style={[!hasAlign ? textStart : undefined, style, { fontFamily }]}
    />
  );
}

/** Use instead of react-native Text so Tajawal is always applied */
export const Text = AppText;

export { fonts as appFonts } from '@/constants/fonts';
