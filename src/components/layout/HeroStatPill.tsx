import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';

type Tone = 'default' | 'success' | 'warning' | 'danger';

type Props = {
  label: string;
  value: string | number;
  tone?: Tone;
  compact?: boolean;
};

export function HeroStatPill({ label, value, tone = 'default', compact }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c, tone, compact), [c, tone, compact]);

  return (
    <View style={styles.pill}>
      <AppText style={styles.value}>{value}</AppText>
      <AppText style={styles.label}>{label}</AppText>
    </View>
  );
}

function toneColor(c: ReturnType<typeof useColors>, tone: Tone): string {
  switch (tone) {
    case 'success':
      return c.success;
    case 'warning':
      return c.warning;
    case 'danger':
      return c.danger;
    default:
      return c.text;
  }
}

function createStyles(c: ReturnType<typeof useColors>, tone: Tone, compact?: boolean) {
  return StyleSheet.create({
    pill: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: compact ? 36 : 42,
      paddingHorizontal: compact ? spacing.md : spacing.lg,
      paddingVertical: compact ? spacing.xs : spacing.sm,
      borderStartWidth: StyleSheet.hairlineWidth,
      borderStartColor: c.border,
    },
    value: {
      ...textLtr,
      fontSize: compact ? 13 : 14,
      fontFamily: fonts.bold,
      color: toneColor(c, tone),
    },
    label: {
      ...textStart,
      fontSize: compact ? 10 : typography.tiny,
      fontFamily: fonts.regular,
      color: c.textMuted,
    },
  });
}
