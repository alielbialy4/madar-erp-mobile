import React from 'react';
import { Pressable, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppText } from './AppText';

export type SelectOption = { label: string; value: string };

type Props = {
  label?: string;
  value?: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  variant?: 'soft' | 'solid';
};

export function AppSelect({ label, value, options, onChange, variant = 'soft' }: Props) {
  const c = useColors();
  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <AppText style={{ color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.label, ...textStart }}>
          {label}
        </AppText>
      ) : null}
      <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={`${option.value}-${index}`}
              onPress={() => onChange(option.value)}
              style={{
                minHeight: 36,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: selected ? c.accent : c.border,
                paddingHorizontal: spacing.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected
                  ? variant === 'solid' ? c.accent : c.accentSoft
                  : c.surface,
              }}
            >
              <AppText style={{
                fontSize: typography.label,
                color: selected
                  ? variant === 'solid' ? c.primaryForeground : c.accent
                  : c.text,
                fontFamily: selected ? fonts.bold : fonts.medium,
                fontWeight: selected ? '700' : '500',
              }}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
