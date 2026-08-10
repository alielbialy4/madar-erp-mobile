import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart, textLtr } from '@/constants/layout';
import { Text } from '@/components/ui/AppText';
import { DashboardSection } from './DashboardSection';

export type DonutSegment = { label: string; value: number; color: string };

type Props = { title: string; hint?: string; data: DonutSegment[]; centerLabel?: string; centerValue?: string };

export function DashboardDonutChart({ title, hint, data, centerLabel, centerValue }: Props) {
  const c = useColors();
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  if (!data.length || total === 0) return null;

  return (
    <DashboardSection title={title} hint={hint} icon="chart-pie" iconTone="info">
      <View style={[styles.surface, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}> 
        {centerValue || centerLabel ? (
          <View style={[styles.summary, { borderBottomColor: c.borderSubtle }]}> 
            {centerValue ? <Text style={[styles.summaryValue, { color: c.text }]}>{centerValue}</Text> : null}
            {centerLabel ? <Text style={[styles.summaryLabel, { color: c.textMuted }]}>{centerLabel}</Text> : null}
          </View>
        ) : null}
        <View style={[styles.composition, { backgroundColor: c.surfaceMuted }]}> 
          {data.filter((item) => item.value > 0).map((item, index) => (
            <View key={`${item.label}-${index}`} style={{ flex: item.value, minWidth: 2, backgroundColor: item.color }} />
          ))}
        </View>
        <View>
          {data.map((item, index) => {
            const percent = Math.round((item.value / total) * 100);
            return (
              <View key={`${item.label}-${index}`} style={[styles.row, index < data.length - 1 && { borderBottomColor: c.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth }]}> 
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={[styles.label, { color: c.text }]} numberOfLines={1}>{item.label}</Text>
                <Text style={[styles.rawValue, { color: c.textMuted }]}>{item.value}</Text>
                <Text style={[styles.percent, { color: c.text }]}>{percent}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  surface: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  summary: { ...flexRow, alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.md, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  summaryValue: { fontFamily: fonts.extraBold, fontSize: typography.cardTitle },
  summaryLabel: { ...textStart, flex: 1, fontFamily: fonts.medium, fontSize: typography.caption },
  composition: { ...flexRow, height: 8, margin: spacing.md, borderRadius: radius.pill, overflow: 'hidden' },
  row: { ...flexRow, minHeight: 48, alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 2 },
  label: { ...textStart, flex: 1, fontFamily: fonts.medium, fontSize: typography.small },
  rawValue: { width: 62, ...textLtr, fontFamily: fonts.medium, fontSize: typography.caption },
  percent: { width: 46, ...textLtr, fontFamily: fonts.extraBold, fontSize: typography.small },
});
