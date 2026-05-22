import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from './AppText';
import { colors } from '@/constants/colors';
import { flexRow } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { pressScale } from '@/utils/animations';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function AppSegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.segment,
              active ? styles.segmentActive : undefined,
              pressed ? pressScale(true, 0.98) : undefined,
            ]}
          >
            <Text style={[styles.label, active ? styles.labelActive : undefined]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...flexRow,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minHeight: 40,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: colors.shadowMd,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: typography.small,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});
