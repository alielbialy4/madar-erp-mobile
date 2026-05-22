import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

export type SelectOption = { label: string; value: string };

type Props = {
  label?: string;
  value?: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  variant?: 'soft' | 'solid';
};

export function AppSelect({ label, value, options, onChange, variant = 'soft' }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.option,
                selected ? (variant === 'solid' ? styles.selectedSolid : styles.selectedSoft) : undefined,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  selected ? (variant === 'solid' ? styles.selectedSolidText : styles.selectedSoftText) : undefined,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { color: colors.text, fontWeight: '700', fontSize: typography.label, ...textStart },
  options: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm },
  option: {
    minHeight: 36,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  selectedSoft: { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
  selectedSolid: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: typography.small, color: colors.text, fontWeight: '600' },
  selectedSoftText: { color: colors.accent, fontWeight: '800' },
  selectedSolidText: { color: colors.primaryForeground, fontWeight: '700' },
});
