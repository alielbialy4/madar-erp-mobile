import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { textLtr, flexRow } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { textStyle } from '@/constants/textStyles';
import { spacing } from '@/constants/spacing';

export type FinancialValueLevel = 'hero' | 'large' | 'value' | 'inline' | 'mini';

export type FinancialValueProps = {
  amount: string | number;
  currency?: string;
  level?: FinancialValueLevel;
  tone?: 'default' | 'positive' | 'negative' | 'muted' | 'accent';
  align?: 'start' | 'end' | 'center';
  prefix?: string;
  style?: ViewStyle;
};

const LEVEL_PRESET: Record<FinancialValueLevel, 'heroMetric' | 'largeFinancial' | 'financialValue' | 'rowPrimary' | 'metadata'> = {
  hero: 'heroMetric',
  large: 'largeFinancial',
  value: 'financialValue',
  inline: 'rowPrimary',
  mini: 'metadata',
};

export function FinancialValue({
  amount,
  currency,
  level = 'value',
  tone = 'default',
  align = 'end',
  prefix,
  style,
}: FinancialValueProps) {
  const c = useColors();
  const color =
    tone === 'positive' ? c.metricPositive
      : tone === 'negative' ? c.metricNegative
        : tone === 'muted' ? c.textMuted
          : tone === 'accent' ? c.accent
            : c.text;

  const display = typeof amount === 'number'
    ? amount.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : String(amount);

  const currencySize =
    level === 'hero' ? typography.sectionTitle
      : level === 'large' ? typography.controlLabel
        : level === 'value' ? typography.metadata
          : typography.caption;

  return (
    <View
      style={[
        styles.row,
        align === 'start' && styles.start,
        align === 'center' && styles.center,
        style,
      ]}
    >
      {prefix ? (
        <AppText numeric translate={false} style={[textStyle(LEVEL_PRESET[level]), { color, marginEnd: spacing.xxs }]}>
          {prefix}
        </AppText>
      ) : null}
      <AppText
        numeric
        translate={false}
        numberOfLines={1}
        style={[textStyle(LEVEL_PRESET[level]), { color }]}
      >
        {display}
      </AppText>
      {currency ? (
        <AppText
          numeric
          translate={false}
          style={{
            ...textLtr,
            color: tone === 'muted' ? c.textCaption : c.textMuted,
            fontSize: currencySize,
            fontFamily: fonts.medium,
            fontWeight: '600',
            marginStart: spacing.xs,
          }}
        >
          {currency}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    ...flexRow,
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    flexShrink: 1,
  },
  start: { justifyContent: 'flex-start' },
  center: { justifyContent: 'center' },
});
