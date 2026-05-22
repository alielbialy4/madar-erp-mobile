import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { MetricCard } from '@/components/ui/MetricCard';
import type { ReportDefinition } from '@/reports/types';
import { money, numberText, asText } from '@/utils/format';
import { metricValue } from '@/utils/reportNormalizers';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';

type Props = {
  definition: ReportDefinition;
  metrics: Record<string, unknown>;
};

function formatMetric(value: unknown, format?: string): string {
  switch (format) {
    case 'money':
      return money(value);
    case 'number':
      return numberText(value);
    case 'percent': {
      const n = Number(value);
      if (!Number.isFinite(n)) return '0%';
      const pct = n <= 1 && n > 0 ? n * 100 : n;
      return `${numberText(pct)}%`;
    }
    default:
      return asText(value, '0');
  }
}

export function ReportSummaryCards({ definition, metrics }: Props) {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const minWidth = `${100 / columns - 2}%` as const;

  if (!definition.metrics.length) return null;

  return (
    <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.md }}>
      {definition.metrics.map((m) => (
        <View key={m.key} style={{ minWidth, flex: 1 }}>
          <MetricCard
            label={m.label}
            value={formatMetric(metricValue(metrics, m.key), m.format)}
            tone={m.tone}
          />
        </View>
      ))}
    </View>
  );
}
