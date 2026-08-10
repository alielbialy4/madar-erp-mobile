import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MetricBlock } from '@/components/madar';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { money, numberText, asText } from '@/utils/format';
import { AppText } from '@/components/ui/AppText';

export type KpiItem = {
  key: string;
  label: string;
  format?: 'money' | 'number' | 'percent' | 'text';
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
};

type Props = {
  items: KpiItem[];
  summary: Record<string, unknown>;
};

function formatValue(value: unknown, format?: KpiItem['format']): string {
  switch (format) {
    case 'money':
      return money(value);
    case 'number':
      return numberText(value);
    case 'percent': {
      const n = Number(value);
      return Number.isFinite(n) ? `${n.toLocaleString('ar-EG-u-nu-latn', { maximumFractionDigits: 1 })}%` : '0%';
    }
    default:
      return asText(value, '—');
  }
}

function mapTone(tone: KpiItem['tone']): 'neutral' | 'positive' | 'negative' | 'warning' | 'info' {
  switch (tone) {
    case 'success':
      return 'positive';
    case 'warning':
      return 'warning';
    case 'danger':
      return 'negative';
    case 'info':
    case 'primary':
      return 'info';
    default:
      return 'neutral';
  }
}

export function ReportKpiRow({ items, summary }: Props) {
  if (!items.length) return null;
  const [primary, ...rest] = items;

  return (
    <View style={styles.root}>
      <MetricBlock
        label={primary.label}
        value={formatValue(summary[primary.key], primary.format)}
        level="B"
        tone={mapTone(primary.tone)}
      />
      {rest.length ? (
        <View style={styles.row}>
          {rest.map((item) => (
            <MetricBlock
              key={item.key}
              label={item.label}
              value={formatValue(summary[item.key], item.format)}
              level="D"
              tone={mapTone(item.tone)}
              style={styles.cell}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ReportSectionHeader({ title, description }: { title: string; description?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText style={{ fontWeight: '800', fontSize: 16, ...textStart, color: c.text }}>{title}</AppText>
      {description ? (
        <AppText style={{ color: c.textMuted, fontSize: 12, ...textStart }}>{description}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  row: {
    ...flexRow,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 110,
  },
});
