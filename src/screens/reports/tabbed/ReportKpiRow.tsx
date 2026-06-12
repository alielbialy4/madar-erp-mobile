import React from 'react';
import { ScrollView, View } from 'react-native';
import { AppCard, AppText } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { money, numberText, asText } from '@/utils/format';

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

function toneColor(tone: KpiItem['tone'], c: ReturnType<typeof useColors>): string {
  switch (tone) {
    case 'success':
      return c.success;
    case 'warning':
      return c.warning;
    case 'danger':
      return c.danger;
    case 'info':
      return c.info;
    case 'primary':
    default:
      return c.accent;
  }
}

export function ReportKpiRow({ items, summary }: Props) {
  const c = useColors();
  if (!items.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ ...flexRow, gap: spacing.sm }}>
      {items.map((item) => {
        const raw = summary[item.key];
        const value = formatValue(raw, item.format);
        const numeric = item.format === 'money' || item.format === 'number' || item.format === 'percent';
        return (
          <AppCard key={item.key} style={{ minWidth: 140, gap: spacing.xs }}>
            <AppText style={{ color: c.textMuted, fontSize: 12, ...textStart }}>{item.label}</AppText>
            <AppText style={{ fontWeight: '800', fontSize: 18, color: toneColor(item.tone, c), ...(numeric ? textLtr : textStart) }}>
              {value}
            </AppText>
          </AppCard>
        );
      })}
    </ScrollView>
  );
}

export function ReportSectionHeader({ title, description }: { title: string; description?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText style={{ fontWeight: '800', fontSize: 16, ...textStart }}>{title}</AppText>
      {description ? <AppText style={{ color: c.textMuted, fontSize: 12, ...textStart }}>{description}</AppText> : null}
    </View>
  );
}
