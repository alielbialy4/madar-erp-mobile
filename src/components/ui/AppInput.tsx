import React, { useState } from 'react';
import { TextInputProps, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, inputTextAlign, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppText } from './AppText';
import { AppTextInput } from './AppTextInput';
import { useTu } from '@/i18n/useTu';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  required?: boolean;
  prefixIcon?: keyof typeof MaterialIcons.glyphMap;
};

export function AppInput({ label, error, required, style, textAlign, prefixIcon, placeholder, onFocus, onBlur, ...props }: Props) {
  const c = useColors();
  const tx = useTu();
  const [focused, setFocused] = useState(false);
  const resolvedPlaceholder = typeof placeholder === 'string' ? tx(placeholder) : placeholder;

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <View style={{ ...flexRow, alignItems: 'center', gap: 2 }}>
          <AppText style={{ color: c.text, fontSize: typography.label, fontFamily: fonts.medium, fontWeight: '600' }}>{label}</AppText>
          {required ? <AppText style={{ color: c.danger, fontSize: typography.label }} translate={false}>*</AppText> : null}
        </View>
      ) : null}
      <View style={{ position: 'relative' }}>
        {prefixIcon ? (
          <View style={{ position: 'absolute', start: spacing.md, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 }}>
            <MaterialIcons name={prefixIcon} size={18} color={focused ? c.accent : c.textCaption} />
          </View>
        ) : null}
        <AppTextInput
          placeholder={resolvedPlaceholder}
          placeholderTextColor={c.textCaption}
          textAlign={textAlign ?? inputTextAlign}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              minHeight: 44,
              borderWidth: focused ? 2 : 1,
              borderColor: error ? c.danger : focused ? c.ring : c.border,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              paddingStart: prefixIcon ? spacing.xxxl : spacing.md,
              color: c.text,
              backgroundColor: focused ? c.surface : c.surface,
              fontSize: typography.body,
              fontFamily: fonts.medium,
              ...textStart,
            },
            props.editable === false && { backgroundColor: c.surfaceMuted, opacity: 0.7 },
            style,
          ]}
          {...props}
        />
      </View>
      {error ? <AppText style={{ color: c.danger, fontSize: typography.tiny }}>{error}</AppText> : null}
    </View>
  );
}
