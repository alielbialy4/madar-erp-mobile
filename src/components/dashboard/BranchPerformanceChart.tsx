import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { numberText } from '@/utils/format';
import { contentAreaRtl, flexRow, textLtr, textStart } from '@/constants/layout';
import { radius, shadows, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/ui/AppText';
import { DashboardSection } from './DashboardSection';

type BranchRow = Record<string, unknown>;

type Props = {
  branches: BranchRow[];
};

const Y_SECTIONS = 4;
const CURRENCY = 'ج.م';
const TODAY_COLOR = 'rgba(37, 99, 235, 0.92)';
const MONTH_COLOR = 'rgba(100, 116, 139, 0.72)';

function formatCompactAmount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${Math.round(value / 1_000)}k`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return numberText(Math.round(value));
}

function CurrencyAmount({
  value,
  compact,
  color,
  mutedColor,
}: {
  value: number;
  compact?: boolean;
  color: string;
  mutedColor: string;
}) {
  const display = compact ? formatCompactAmount(value) : numberText(value);
  return (
    <View style={styles.currencyRow}>
      <Text
        style={[compact ? styles.currencyValueSm : styles.currencyValue, { color }, textLtr]}
        numberOfLines={1}
      >
        {display}
      </Text>
      <Text style={[styles.currencyUnit, { color: mutedColor }]}>{CURRENCY}</Text>
    </View>
  );
}

export function BranchPerformanceChart({ branches }: Props) {
  const c = useColors();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const isPortrait = screenHeight > screenWidth;
  const [containerWidth, setContainerWidth] = useState(0);

  const rows = useMemo(
    () =>
      branches.map((b) => ({
        name: String(b.name ?? 'فرع'),
        today: Number(b.today_revenue ?? 0),
        month: Number(b.month_revenue ?? 0),
      })),
    [branches],
  );

  if (!rows.length) return null;

  const todayValues = rows.map((r) => r.today);
  const monthValues = rows.map((r) => r.month);
  const peak = Math.max(...todayValues, ...monthValues, 0);
  const maxScale = peak * 1.12 || 1;
  const topToday = Math.max(...todayValues, 0);

  const chartHeight = isPortrait ? 156 : 172;
  const barWidth = isPortrait ? 12 : 14;
  const pairGap = 4;
  const groupGap = isPortrait ? 14 : 10;
  const groupWidth = barWidth * 2 + pairGap;
  const slotWidth = groupWidth + groupGap;
  const plotWidth = rows.length * slotWidth + spacing.md;
  const yAxisWidth = isPortrait ? 54 : 48;
  const scrollable = plotWidth > Math.max(containerWidth - yAxisWidth - spacing.sm, 0);

  const yTicks = useMemo(
    () => Array.from({ length: Y_SECTIONS + 1 }, (_, i) => (maxScale / Y_SECTIONS) * (Y_SECTIONS - i)),
    [maxScale],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setContainerWidth(w);
  };

  const plot = (
    <View style={[styles.plotWrap, { width: Math.max(plotWidth, containerWidth - yAxisWidth) }]}>
      <View style={[styles.plotArea, { height: chartHeight, borderBottomColor: c.borderSubtle }]}>
        {yTicks.slice(1, -1).map((tick) => {
          const top = ((maxScale - tick) / maxScale) * chartHeight;
          return (
            <View key={`grid-${tick}`} style={[styles.gridLine, { top, backgroundColor: c.borderSubtle }]} />
          );
        })}
        <View style={[styles.groupsRow, { height: chartHeight }]}>
          {rows.map((row, index) => {
            const todayH = Math.max(row.today > 0 ? 3 : 0, (row.today / maxScale) * chartHeight);
            const monthH = Math.max(row.month > 0 ? 3 : 0, (row.month / maxScale) * chartHeight);
            return (
              <View key={`group-${index}`} style={[styles.groupSlot, { width: slotWidth }]}>
                <View style={[styles.pairRow, { gap: pairGap }]}>
                  <View style={[styles.bar, { width: barWidth, height: todayH, backgroundColor: TODAY_COLOR }]} />
                  <View style={[styles.bar, { width: barWidth, height: monthH, backgroundColor: MONTH_COLOR }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.namesRow}>
        {rows.map((row, index) => (
          <View key={`name-${index}`} style={[styles.nameSlot, { width: slotWidth }]}>
            <Text style={[styles.nameLabel, { color: c.textCaption }]} numberOfLines={2}>
              {row.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <DashboardSection
      title="أداء الفروع"
      hint="إيرادات اليوم مقابل الشهر"
      icon="buildings"
      iconTone="accent"
      badge={`${rows.length}`}
    >
      <View
        onLayout={onLayout}
        style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}
      >
        <View style={[styles.legend, flexRow]}>
          <View style={[styles.legendDot, { backgroundColor: TODAY_COLOR }]} />
          <Text style={[styles.legendText, { color: c.textMuted }]}>اليوم</Text>
          <View style={[styles.legendDot, { backgroundColor: MONTH_COLOR }]} />
          <Text style={[styles.legendText, { color: c.textMuted }]}>الشهر</Text>
        </View>

        <View style={[styles.chartRow, contentAreaRtl]}>
          <View style={[styles.yAxis, { width: yAxisWidth, height: chartHeight }]}>
            {yTicks.map((tick) => (
              <CurrencyAmount
                key={`y-${tick}`}
                value={tick}
                compact
                color={c.textCaption}
                mutedColor={c.textCaption}
              />
            ))}
          </View>
          {scrollable ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.plotScroll}
              contentContainerStyle={styles.plotScrollContent}
            >
              {plot}
            </ScrollView>
          ) : (
            <View style={styles.plotScroll}>{plot}</View>
          )}
        </View>

        <View style={[styles.footer, { borderTopColor: c.borderSubtle }]}>
          <Text style={[styles.footerLabel, { color: c.textMuted }]}>أعلى فرع اليوم</Text>
          <CurrencyAmount value={topToday} color={c.text} mutedColor={c.textMuted} />
        </View>
      </View>
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
    width: '100%',
    ...shadows.md,
  },
  legend: {
    gap: spacing.xs,
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: typography.tiny,
    fontFamily: fonts.medium,
    marginEnd: spacing.sm,
  },
  chartRow: {
    ...flexRow,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  yAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 36,
  },
  plotScroll: {
    flex: 1,
    minWidth: 0,
  },
  plotScrollContent: {
    paddingEnd: spacing.sm,
  },
  plotWrap: {
    minWidth: 0,
  },
  plotArea: {
    position: 'relative',
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    opacity: 0.65,
  },
  groupsRow: {
    ...flexRow,
    alignItems: 'flex-end',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  groupSlot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  pairRow: {
    ...flexRow,
    alignItems: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  namesRow: {
    ...flexRow,
    marginTop: spacing.xs,
    minHeight: 32,
  },
  nameSlot: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
  },
  nameLabel: {
    ...textStart,
    fontSize: 9,
    fontFamily: fonts.medium,
    textAlign: 'center',
    lineHeight: 13,
  },
  currencyRow: {
    ...flexRow,
    alignItems: 'center',
    gap: 3,
  },
  currencyValue: {
    fontSize: typography.body,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
  },
  currencyValueSm: {
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  currencyUnit: {
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLabel: {
    fontSize: typography.caption,
    fontFamily: fonts.medium,
  },
});
