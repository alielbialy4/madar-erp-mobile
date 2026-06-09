import React from 'react';
import { StyleSheet, TextInput as RNTextInput, TextInputProps, type StyleProp, type TextStyle } from 'react-native';
import { inputTextAlign, inputTextAlignNumeric, textAlignStart, textLtr, textRtlBase } from '@/constants/layout';
import { fonts, resolveTajawalFontOnly } from '@/constants/fonts';

type AppTextInputProps = TextInputProps & {
  numeric?: boolean;
};

export function AppTextInput({ style, textAlign, numeric, ...props }: AppTextInputProps) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontStyle = resolveTajawalFontOnly(style as StyleProp<TextStyle>, fonts.medium);

  const writingDirection =
    flat?.writingDirection ?? (numeric ? 'ltr' : textRtlBase.writingDirection);

  const trailingStyle: TextStyle | undefined = (() => {
    if (textAlign != null) return undefined;
    if (numeric) return flat?.textAlign == null ? textLtr : undefined;
    if (flat?.textAlign === 'center') return undefined;
    return textAlignStart;
  })();

  return (
    <RNTextInput
      {...props}
      textAlign={textAlign ?? (numeric ? inputTextAlignNumeric : inputTextAlign)}
      {...(numeric ? { 'data-numeric': 'true' } : undefined)}
      style={[fontStyle, { writingDirection }, trailingStyle]}
    />
  );
}

export const TextInput = AppTextInput;
