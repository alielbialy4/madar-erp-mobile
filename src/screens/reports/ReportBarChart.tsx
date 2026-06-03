import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppCard, AppSectionHeader, AppText } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { money, numberText } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { textStart } from '@/constants/layout';

type Props = {
  title: string;
  rows: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  valueFormat?: 'money' | 'number';
};

export function ReportBarChart({ title, rows, labelKey, valueKey, valueFormat = 'number' }: Props) {
  const c = useColors();
  const { max, bars } = useMemo(() => {
    const parsed = rows
      .map((row) => ({
        label: String(row[labelKey] ?? '—'),
        value: Number(row[valueKey] ?? 0),
      }))
      .filter((r) => Number.isFinite(r.value));
    const peak = Math.max(...parsed.map((r) => r.value), 1);
    return { max: peak, bars: parsed.slice(0, 24) };
  }, [rows, labelKey, valueKey]);

  if (!bars.length) return null;

  const formatValue = (v: number) => (valueFormat === 'money' ? money(v) : numberText(v));

  return (
    <AppCard style={{ gap: spacing.md }}>
      <AppSectionHeader title={title} />
      <View style={{ gap: spacing.sm }}>
        {bars.map((bar, index) => {
          const widthPct = Math.max(4, Math.round((bar.value / max) * 100));
          return (
            <View key={`${bar.label}-${index}`} style={{ gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText style={{ ...textStart, flex: 1 }} numberOfLines={1}>
                  {bar.label}
                </AppText>
                <AppText style={{ fontWeight: '700' }}>{formatValue(bar.value)}</AppText>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: c.surfaceMuted, overflow: 'hidden' }}>
                <View style={{ width: `${widthPct}%`, height: '100%', backgroundColor: c.accent, borderRadius: 4 }} />
              </View>
            </View>
          );
        })}
      </View>
    </AppCard>
  );
}
