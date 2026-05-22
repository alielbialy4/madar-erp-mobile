import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function AppSegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const c = useColors();
  return (
    <View style={{
      ...flexRow,
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.lg,
      padding: 4,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              minHeight: 40,
              backgroundColor: active ? c.surface : 'transparent',
              borderWidth: active ? 1 : 0,
              borderColor: active ? c.borderSubtle : 'transparent',
              ...(active ? {
                shadowColor: c.shadow,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 1,
                shadowRadius: 3,
                elevation: 2,
              } : {}),
            }}
          >
            <AppText style={{
              fontSize: typography.label,
              fontFamily: active ? fonts.bold : fonts.medium,
              fontWeight: active ? '700' : '500',
              color: active ? c.text : c.textMuted,
            }}>
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
