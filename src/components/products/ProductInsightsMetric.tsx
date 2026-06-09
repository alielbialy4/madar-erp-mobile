import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppBadge } from '@/components/ui';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { Text } from '@/components/ui/AppText';

export type MetricKind = 'qty' | 'money' | 'percent' | 'date' | 'text' | 'count';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

type Props = {
  label: string;
  value: string;
  kind: MetricKind;
  tone?: Tone;
  /** Secondary line — e.g. total amount under quantity */
  subValue?: string;
  subKind?: MetricKind;
  compact?: boolean;
};

const UNIT_LABELS: Record<MetricKind, string | null> = {
  qty: 'وحدة',
  money: 'ج.م',
  percent: '%',
  date: null,
  text: null,
  count: null,
};

function toneColor(c: AppColors, tone: Tone): string {
  switch (tone) {
    case 'success':
      return c.success;
    case 'warning':
      return c.warning;
    case 'danger':
      return c.danger;
    case 'info':
      return c.info;
    default:
      return c.text;
  }
}

function badgeTone(kind: MetricKind, tone: Tone): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default' {
  if (kind === 'money') return 'success';
  if (kind === 'qty') return 'info';
  if (kind === 'percent') return tone === 'danger' ? 'danger' : 'warning';
  return 'neutral';
}

export function ProductInsightsMetric({
  label,
  value,
  kind,
  tone = 'default',
  subValue,
  subKind,
  compact,
}: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c, compact), [c, compact]);
  const valueColor = toneColor(c, tone);
  const unit = UNIT_LABELS[kind];

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: valueColor }, kind === 'money' || kind === 'qty' ? textLtr : undefined]}>
          {value}
        </Text>
        {unit ? <AppBadge label={unit} tone={badgeTone(kind, tone)} /> : null}
      </View>
      {subValue ? (
        <View style={styles.subRow}>
          <Text style={styles.subLabel}>{subKind === 'money' ? 'الإجمالي' : 'ملاحظة'}</Text>
          <Text style={[styles.subValue, subKind === 'money' ? textLtr : undefined]}>{subValue}</Text>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>, compact?: boolean) {
  return StyleSheet.create({
    card: {
      gap: spacing.xs,
      padding: compact ? spacing.sm : spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      minWidth: 0,
    },
    label: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
    valueRow: {
      ...flexRow,
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    value: {
      fontSize: compact ? typography.sectionTitle : 22,
      fontFamily: fonts.extraBold,
      lineHeight: compact ? 24 : 28,
    },
    subRow: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderSubtle,
    },
    subLabel: {
      fontSize: typography.micro,
      fontFamily: fonts.medium,
      color: c.textCaption,
    },
    subValue: {
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.success,
    },
  });
}
