import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { inputTextAlign, textStart } from '@/constants/layout';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  required?: boolean;
};

export function AppInput({ label, error, required, style, textAlign, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required ? <Text style={styles.required}>*</Text> : null}
        </View>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textCaption}
        textAlign={textAlign ?? inputTextAlign}
        style={[styles.input, error ? styles.errorBorder : undefined, props.editable === false ? styles.disabled : undefined, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  label: {
    ...textStart,
    color: colors.text,
    fontSize: typography.label,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },
  required: { color: colors.danger, fontSize: typography.label },
  input: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.background,
    fontSize: typography.body,
    fontFamily: fonts.medium,
    ...textStart,
  },
  errorBorder: { borderColor: colors.danger },
  disabled: { backgroundColor: colors.surfaceMuted, opacity: 0.7 },
  error: {
    ...textStart,
    color: colors.danger,
    fontSize: typography.tiny,
    fontFamily: fonts.medium,
  },
});
