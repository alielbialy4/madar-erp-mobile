import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { inputTextAlign, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppText } from './AppText';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  required?: boolean;
};

export function AppInput({ label, error, required, style, textAlign, ...props }: Props) {
  const c = useColors();

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <AppText style={{ color: c.text, fontSize: typography.label, fontFamily: fonts.medium, fontWeight: '600' }}>{label}</AppText>
          {required ? <AppText style={{ color: c.danger, fontSize: typography.label }}>*</AppText> : null}
        </View>
      ) : null}
      <TextInput
        placeholderTextColor={c.textCaption}
        textAlign={textAlign ?? inputTextAlign}
        style={[
          {
            minHeight: 44,
            borderWidth: 1,
            borderColor: error ? c.danger : c.borderSubtle,
            borderRadius: radius.input,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            color: c.text,
            backgroundColor: c.surface,
            fontSize: typography.body,
            fontFamily: fonts.medium,
            ...textStart,
          },
          props.editable === false && { backgroundColor: c.surfaceMuted, opacity: 0.7 },
          style,
        ]}
        {...props}
      />
      {error ? <AppText style={{ color: c.danger, fontSize: typography.tiny }}>{error}</AppText> : null}
    </View>
  );
}
