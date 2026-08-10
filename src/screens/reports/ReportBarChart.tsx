import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppSectionHeader, AppText } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { money, numberText } from '@/utils/format';
import { radius, spacing } from '@/constants/spacing';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';

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
      .map((row, index) => ({
        label: String(row[labelKey] ?? '—'),
        value: Number(row[valueKey] ?? 0),
        index,
      }))
      .filter((r) => Number.isFinite(r.value));
    const peak = Math.max(...parsed.map((r) => Math.abs(r.value)), 1);
    const active = parsed.filter((row) => Math.abs(row.value) > 0);
    const selected = active.length
      ? [...active].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 12).sort((a, b) => a.index - b.index)
      : parsed.slice(0, 12);
    return { max: peak, bars: selected };
  }, [rows, labelKey, valueKey]);

  const formatValue = (v: number) => (valueFormat === 'money' ? money(v) : numberText(v));
  const styles = useMemo(() => StyleSheet.create({
    surface: {
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    rows: { gap: spacing.md },
    row: { gap: spacing.xs },
    labels: { ...flexRow, alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.md },
    label: { ...textStart, flex: 1, color: c.textMuted, fontFamily: fonts.medium, fontSize: typography.small },
    value: { ...textLtr, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.small },
    track: { height: 6, borderRadius: radius.pill, backgroundColor: c.surfaceMuted, overflow: 'hidden' },
    bar: { height: '100%', borderRadius: radius.pill },
    note: { ...textStart, color: c.textCaption, fontFamily: fonts.regular, fontSize: typography.micro },
  }), [c]);

  if (!bars.length) return null;

  return (
    <View style={styles.surface} accessibilityLabel={`${title}، ${bars.length} قيم`}>
      <AppSectionHeader title={title} />
      <View style={styles.rows}>
        {bars.map((bar, index) => {
          const widthPct = Math.round((Math.abs(bar.value) / max) * 100);
          return (
            <View key={`${bar.label}-${index}`} style={styles.row}>
              <View style={styles.labels}>
                <AppText style={styles.label} numberOfLines={1}>
                  {bar.label}
                </AppText>
                <AppText style={styles.value}>{formatValue(bar.value)}</AppText>
              </View>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${widthPct}%`, backgroundColor: bar.value < 0 ? c.danger : c.info }]} />
              </View>
            </View>
          );
        })}
      </View>
      {rows.length > bars.length ? <AppText style={styles.note}>يعرض حتى 12 نقطة ذات أعلى نشاط بترتيبها الأصلي؛ القائمة أدناه هي المرجع الكامل.</AppText> : null}
    </View>
  );
}
