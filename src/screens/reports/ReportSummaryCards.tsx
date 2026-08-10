import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import type { ReportDefinition } from '@/reports/types';
import { money, numberText, asText } from '@/utils/format';
import { metricValue } from '@/utils/reportNormalizers';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';

type Props = { definition: ReportDefinition; metrics: Record<string, unknown> };

function formatMetric(value: unknown, format?: string): string {
  if (format === 'money') return money(value);
  if (format === 'number') return numberText(value);
  if (format === 'percent') {
    const number = Number(value);
    if (!Number.isFinite(number)) return '0%';
    return `${numberText(number <= 1 && number > 0 ? number * 100 : number)}%`;
  }
  return asText(value, '0');
}

export function ReportSummaryCards({ definition, metrics }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  if (!definition.metrics.length) return null;

  return (
    <View style={[styles.surface, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}> 
      {definition.metrics.map((metric, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const rows = Math.ceil(definition.metrics.length / columns);
        const spansRow = columns === 2 && definition.metrics.length % 2 === 1 && index === definition.metrics.length - 1;
        const toneColor = metric.tone === 'danger'
          ? c.danger
          : metric.tone === 'warning'
            ? c.warning
            : metric.tone === 'success'
              ? c.success
              : metric.tone === 'info'
                ? c.info
                : c.text;
        return (
          <View
            key={metric.key}
            style={[
              styles.cell,
              { width: spansRow ? '100%' : `${100 / columns}%` },
              col > 0 && { borderStartColor: c.borderSubtle, borderStartWidth: StyleSheet.hairlineWidth },
              row < rows - 1 && { borderBottomColor: c.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <AppText style={[styles.label, { color: c.textMuted }]} numberOfLines={2}>{metric.label}</AppText>
            <AppText style={[styles.value, { color: toneColor }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatMetric(metricValue(metrics, metric.key), metric.format)}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { ...flexRow, flexWrap: 'wrap', borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, overflow: 'hidden' },
  cell: { minHeight: 82, justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { ...textStart, fontFamily: fonts.medium, fontSize: typography.caption, lineHeight: 16 },
  value: { ...textStart, fontFamily: fonts.extraBold, fontSize: 22, lineHeight: 28 },
});
