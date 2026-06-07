import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { LineChart } from 'react-native-gifted-charts';
import { useColors } from '@/hooks/useColors';
import { money } from '@/utils/format';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { glassTokens } from '@/constants/glass';
import { Text } from '@/components/ui/AppText';
import { DashboardSection } from './DashboardSection';

type Props = {
  days: string[];
  revenue: number[];
  title?: string;
  hint?: string;
};

export function RevenueTrendChart({
  days,
  revenue,
  title = 'اتجاه الإيرادات',
  hint = 'آخر 14 يومًا — متابعة سريعة للأداء.',
}: Props) {
  const c = useColors();

  const labels = useMemo(
    () =>
      days.map((day) => {
        const parts = (day || '').split('-');
        return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : day;
      }),
    [days],
  );

  const peak = useMemo(() => Math.max(...revenue.map((n) => Number(n) || 0)), [revenue]);
  const total = useMemo(() => revenue.reduce((s, n) => s + (Number(n) || 0), 0), [revenue]);

  const chartData = useMemo(
    () =>
      revenue.map((value, index) => ({
        value: Number(value) || 0,
        label: labels[index],
        dataIndex: index,
      })),
    [revenue, labels],
  );

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 200 }}
    >
      <DashboardSection title={title} hint={hint} icon="show-chart" iconTone="info" badge={`${days.length} يوم`} badgeTone="info">
        <View style={styles.cardWrap}>
          <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFillObject} />
          <View style={[styles.card, { backgroundColor: c.glassSurface, borderColor: c.glassBorder }]}>
            {revenue.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: c.textMuted }]}>لا توجد بيانات اتجاه للعرض.</Text>
              </View>
            ) : (
              <>
                <View style={styles.chartArea}>
                  <LineChart
                    data={chartData}
                    areaChart
                    curved
                    isAnimated
                    animationDuration={900}
                    startFillColor={c.primary}
                    endFillColor={c.primary}
                    startOpacity={0.25}
                    endOpacity={0.02}
                    color={c.primary}
                    thickness={2.5}
                    startFillColor1={c.primary}
                    endFillColor1={c.primary}
                    startOpacity1={0.25}
                    endOpacity1={0.02}
                    xAxisLabelTextStyle={{ color: c.textCaption, fontSize: 9, fontFamily: fonts.regular }}
                    yAxisColor={c.borderSubtle}
                    noOfSections={4}
                    adjustToWidth
                    spacing={Math.max(10, 100 / Math.max(days.length, 1))}
                    dataPointsColor={c.primary}
                    dataPointsRadius={3}
                    showVerticalLines={false}
                    rulesColor={c.borderSubtle}
                    rulesType="solid"
                    showYAxisIndices={false}
                    showXAxisIndices={false}
                    width={
                      chartData.length > 0
                        ? Math.max(chartData.length * 28, 280)
                        : undefined
                    }
                  />
                </View>
                <View style={[styles.footer, { borderTopColor: c.glassBorder }]}>
                  <View style={styles.footerItem}>
                    <Text style={[styles.footerLabel, { color: c.textMuted }]}>الإجمالي</Text>
                    <Text style={[styles.footerValue, { color: c.text }]}>{money(total)}</Text>
                  </View>
                  <View style={[styles.footerDivider, { backgroundColor: c.glassBorder }]} />
                  <View style={styles.footerItem}>
                    <Text style={[styles.footerLabel, { color: c.textMuted }]}>أعلى يوم</Text>
                    <Text style={[styles.footerValue, { color: c.text }]}>{money(peak)}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </DashboardSection>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    borderRadius: radius.card,
    overflow: 'hidden',
    ...glassTokens.shadow.md,
  },
  card: {
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  chartArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    minHeight: 160,
  },
  empty: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.body,
    fontFamily: fonts.regular,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  footerDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  footerLabel: {
    fontSize: typography.caption,
    fontFamily: fonts.medium,
  },
  footerValue: {
    fontSize: typography.body,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
  },
});
