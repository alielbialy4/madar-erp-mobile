import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/ui/AppText';
import { DashboardSection } from './DashboardSection';

export type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  title: string;
  hint?: string;
  data: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
};

export function DashboardDonutChart({ title, hint, data, centerLabel, centerValue }: Props) {
  const c = useColors();
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  if (!data.length || total === 0) return null;

  const pieData = data.map((d) => ({ value: d.value, color: d.color }));

  return (
    <DashboardSection title={title} hint={hint} icon="chart-pie" iconTone="info">
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
        <View style={styles.chartRow}>
          <View style={styles.chartWrap}>
            <PieChart
              data={pieData}
              donut
              radius={55}
              innerRadius={38}
              innerCircleColor={c.surface}
              innerCircleBorderWidth={0}
              centerLabelComponent={() => (
                <View style={styles.center}>
                  {centerValue ? <Text style={[styles.centerValue, { color: c.text }]}>{centerValue}</Text> : null}
                  {centerLabel ? <Text style={[styles.centerLabel, { color: c.textMuted }]}>{centerLabel}</Text> : null}
                </View>
              )}
            />
          </View>
          <View style={styles.legend}>
            {data.map((d, i) => {
              const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
              return (
                <View key={i} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                  <Text style={[styles.legendLabel, { color: c.text }]} numberOfLines={1}>{d.label}</Text>
                  <Text style={[styles.legendPct, { color: c.textMuted }]}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  chartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: 18,
    fontFamily: fonts.extraBold,
  },
  centerLabel: {
    fontSize: 10,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  legend: {
    flex: 1,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendLabel: {
    flex: 1,
    fontSize: typography.small,
    fontFamily: fonts.medium,
    writingDirection: 'rtl',
  },
  legendPct: {
    fontSize: typography.small,
    fontFamily: fonts.bold,
  },
});
