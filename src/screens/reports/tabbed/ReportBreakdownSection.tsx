import React from 'react';
import { View } from 'react-native';
import { AppCard, AppText } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { money, numberText, asText } from '@/utils/format';
import { ReportSectionHeader } from './ReportKpiRow';

export type BreakdownRow = {
  label: string;
  value: unknown;
  format?: 'money' | 'number' | 'text';
  sub?: string;
};

type Props = {
  title: string;
  description?: string;
  rows: BreakdownRow[];
  labelKey?: string;
  valueKey?: string;
  valueFormat?: 'money' | 'number' | 'text';
  data?: Record<string, unknown>[];
};

function formatBreakdownValue(value: unknown, format?: 'money' | 'number' | 'text'): string {
  switch (format) {
    case 'money':
      return money(value);
    case 'number':
      return numberText(value);
    default:
      return asText(value, '—');
  }
}

export function ReportBreakdownSection({ title, description, rows, labelKey, valueKey, valueFormat, data }: Props) {
  const c = useColors();
  const list: BreakdownRow[] = rows.length
    ? rows
    : (data ?? []).map((row) => ({
        label: asText(labelKey ? row[labelKey] : row.name ?? row.label, '—'),
        value: valueKey ? row[valueKey] : row.value ?? row.total ?? row.quantity,
        format: valueFormat,
      }));

  if (!list.length) return null;

  const max = Math.max(...list.map((r) => Number(r.value) || 0), 1);

  return (
    <View style={{ gap: spacing.md }}>
      <ReportSectionHeader title={title} description={description} />
      <View style={{ gap: spacing.sm }}>
        {list.map((row, index) => {
          const num = Number(row.value) || 0;
          const pct = max > 0 ? (num / max) * 100 : 0;
          const numeric = row.format === 'money' || row.format === 'number';
          return (
            <AppCard key={`${row.label}-${index}`} style={{ gap: spacing.sm }}>
              <View style={{ ...flexRow, justifyContent: 'space-between', gap: spacing.md }}>
                <AppText style={{ flex: 1, ...textStart }}>{row.label}</AppText>
                <AppText style={{ fontWeight: '700', ...(numeric ? textLtr : textStart) }}>
                  {formatBreakdownValue(row.value, row.format ?? valueFormat)}
                </AppText>
              </View>
              {row.sub ? <AppText style={{ color: c.textMuted, fontSize: 12, ...textStart }}>{row.sub}</AppText> : null}
              <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surfaceMuted, overflow: 'hidden' }}>
                <View style={{ width: `${pct}%`, height: '100%', backgroundColor: c.accent, borderRadius: 3 }} />
              </View>
            </AppCard>
          );
        })}
      </View>
    </View>
  );
}
