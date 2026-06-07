import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/ui/AppText';
import { money } from '@/utils/format';
import { DashboardSection } from './DashboardSection';

type BarItem = {
  label: string;
  value: number;
};

type Props = {
  title: string;
  hint?: string;
  data: BarItem[];
  icon?: string;
  iconTone?: 'accent' | 'success' | 'info' | 'warning' | 'danger' | 'neutral';
};

export function DashboardBarChart({ title, hint, data, icon = 'chart-bar', iconTone = 'accent' }: Props) {
  const c = useColors();

  if (!data.length) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barColor = c.accent;

  return (
    <DashboardSection title={title} hint={hint} icon={icon} iconTone={iconTone}>
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
        <BarChart
          data={data.map((d, i) => ({
            value: d.value,
            label: d.label,
            frontColor: barColor + (i % 2 === 0 ? '' : 'AA'),
            topLabelComponent: () => (
              <Text style={[styles.barTopLabel, { color: c.text }]} numberOfLines={1}>
                {money(d.value)}
              </Text>
            ),
            topLabelContainerStyle: { marginBottom: 4 },
          }))}
          barWidth={Math.max(20, Math.min(40, 280 / data.length - 4))}
          spacing={8}
          roundedTop
          roundedBottom={false}
          noOfSections={4}
          maxValue={maxValue * 1.15}
          yAxisThickness={0}
          xAxisThickness={StyleSheet.hairlineWidth}
          xAxisColor={c.borderSubtle}
          yAxisTextStyle={{ color: c.textCaption, fontSize: 10, fontFamily: fonts.regular }}
          xAxisLabelTextStyle={{ color: c.textCaption, fontSize: 10, fontFamily: fonts.regular, writingDirection: 'rtl' }}
          showVerticalLines={false}
          isAnimated
          animationDuration={600}
          labelWidth={50}
          height={140}
          rotateLabel={data.length > 4}
        />
      </View>
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    overflow: 'hidden',
  },
  barTopLabel: {
    fontSize: 9,
    fontFamily: fonts.bold,
  },
});
