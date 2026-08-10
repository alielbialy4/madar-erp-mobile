import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { FinancialValue } from './FinancialValue';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { textStyle } from '@/constants/textStyles';

export type MetricBlockLevel = 'A' | 'B' | 'C' | 'D';

export type MetricBlockProps = {
  label: string;
  value: string | number;
  currency?: string;
  hint?: string;
  delta?: string;
  deltaUp?: boolean;
  level?: MetricBlockLevel;
  /** Semantic cue only — never full-card tint */
  tone?: 'neutral' | 'positive' | 'negative' | 'warning' | 'info';
  style?: ViewStyle;
};

export function MetricBlock({
  label,
  value,
  currency,
  hint,
  delta,
  deltaUp,
  level = 'B',
  tone = 'neutral',
  style,
}: MetricBlockProps) {
  const c = useColors();
  const cue =
    tone === 'positive' ? c.success
      : tone === 'negative' ? c.danger
        : tone === 'warning' ? c.warning
          : tone === 'info' ? c.info
            : c.accent;

  const financialLevel = level === 'A' ? 'hero' : level === 'B' ? 'large' : level === 'C' ? 'value' : 'mini';
  const isCompact = level === 'C' || level === 'D';

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: c.surface,
          borderColor: c.borderSubtle,
          padding: isCompact ? spacing.md : spacing.lg,
          minHeight: level === 'A' ? 120 : level === 'B' ? 96 : level === 'C' ? 72 : 56,
        },
        style,
      ]}
    >
      <View style={styles.labelRow}>
        <View style={[styles.cue, { backgroundColor: cue }]} />
        <AppText style={[textStyle('controlLabel'), { color: c.textMuted, flex: 1 }]} numberOfLines={2}>
          {label}
        </AppText>
        {delta ? (
          <AppText
            numeric
            translate={false}
            style={{
              ...textStart,
              fontSize: typography.caption,
              fontFamily: fonts.bold,
              fontWeight: '700',
              color: deltaUp !== false ? c.success : c.danger,
            }}
          >
            {delta}
          </AppText>
        ) : null}
      </View>
      <FinancialValue
        amount={value}
        currency={currency}
        level={financialLevel}
        align="start"
        tone={tone === 'positive' ? 'positive' : tone === 'negative' ? 'negative' : 'default'}
      />
      {hint ? (
        <AppText style={[textStyle('metadata'), { color: c.textCaption }]} numberOfLines={1}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.surface,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  labelRow: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.sm,
  },
  cue: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
});
