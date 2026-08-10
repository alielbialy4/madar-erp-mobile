import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { MetricBlock } from '@/components/madar';
import type { ReportDefinition } from '@/reports/types';
import { money, numberText, asText } from '@/utils/format';
import { metricValue } from '@/utils/reportNormalizers';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';

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

function toneFor(
  tone?: string,
): 'neutral' | 'positive' | 'negative' | 'warning' | 'info' {
  if (tone === 'danger') return 'negative';
  if (tone === 'warning') return 'warning';
  if (tone === 'success') return 'positive';
  if (tone === 'info') return 'info';
  return 'neutral';
}

export function ReportSummaryCards({ definition, metrics }: Props) {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  if (!definition.metrics.length) return null;

  const primary = definition.metrics[0];
  const rest = definition.metrics.slice(1);

  return (
    <View style={styles.root}>
      <MetricBlock
        label={primary.label}
        value={formatMetric(metricValue(metrics, primary.key), primary.format)}
        level="A"
        tone={toneFor(primary.tone)}
      />
      {rest.length ? (
        <View style={styles.grid}>
          {rest.map((metric) => (
            <MetricBlock
              key={metric.key}
              label={metric.label}
              value={formatMetric(metricValue(metrics, metric.key), metric.format)}
              level="C"
              tone={toneFor(metric.tone)}
              style={{ width: columns >= 3 ? `${100 / Math.min(columns, rest.length)}%` : '48%', flexGrow: 1 }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  grid: {
    ...flexRow,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
