import React from 'react';
import { TextInput as RNTextInput, TextInputProps, type StyleProp, type TextStyle } from 'react-native';
import { inputTextAlign, textStart } from '@/constants/layout';
import { fonts, resolveTajawalStyle } from '@/constants/fonts';

/** TextInput with Tajawal applied by default */
export function AppTextInput({ style, textAlign, ...props }: TextInputProps) {
  const resolved = resolveTajawalStyle(style as StyleProp<TextStyle>, fonts.medium);

  return (
    <RNTextInput
      {...props}
      textAlign={textAlign ?? inputTextAlign}
      style={[textStart, resolved]}
    />
  );
}

export const TextInput = AppTextInput;
