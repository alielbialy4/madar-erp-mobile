import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { numberText } from '@/utils/format';
import { contentAreaRtl, flexRow, isRtl, textLtr, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/ui/AppText';
import { DashboardSection } from './DashboardSection';

type Props = {
  /** ISO dates (YYYY-MM-DD) preferred; display strings also accepted */
  days: string[];
  revenue: number[];
  title?: string;
  hint?: string;
  variant?: 'bar' | 'line';
  badge?: string;
  compact?: boolean;
  valueKind?: 'money' | 'qty';
};

type AxisDateParts = { day: string; month: string };

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const MONTH_SHORT_AR = ['', 'ينا', 'فبر', 'مار', 'أبر', 'مايو', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'];

function parseAxisDate(raw: string): AxisDateParts | null {
  const match = ISO_DATE_RE.exec((raw || '').trim());
  if (!match) return null;
  const monthIndex = Number(match[2]);
  return {
    day: match[3],
    month: MONTH_SHORT_AR[monthIndex] ?? match[2],
  };
}

function formatAxisRangeLabel(raw: string): string {
  const parts = parseAxisDate(raw);
  if (!parts) return raw;
  return `${parts.day} ${parts.month}`;
}

const Y_SECTIONS = 4;
const CURRENCY = 'ج.م';

function isEffectivelyEmpty(values: number[]): boolean {
  return values.length === 0 || values.every((v) => !v || Number(v) === 0);
}

function formatCompactAmount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${Math.round(value / 1_000)}k`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return numberText(Math.round(value));
}

function visibleLabelIndices(count: number, step: number): Set<number> {
  if (count <= 0) return new Set();
  const indices = new Set<number>();
  indices.add(0);
  for (let i = step; i < count; i += step) indices.add(i);
  if (count > 1) indices.add(count - 1);
  return indices;
}

function labelStepForCount(count: number, compact?: boolean): number {
  if (count <= 7) return 1;
  if (count <= 14) return 2;
  if (count <= 21) return 3;
  if (count <= 31) return compact ? 5 : 4;
  return compact ? 7 : 5;
}

type ChartPoint = { x: number; y: number; value: number };

function buildSmoothPath(points: ChartPoint[]): string {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const middleX = (previous.x + point.x) / 2;
    return `${path} C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
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
        style={[
          compact ? styles.currencyValueSm : styles.currencyValue,
          { color },
          textLtr,
        ]}
        numberOfLines={1}
      >
        {display}
      </Text>
      <Text style={[styles.currencyUnit, { color: mutedColor }]}>{CURRENCY}</Text>
    </View>
  );
}

function FooterValue({
  value,
  kind,
  color,
  mutedColor,
}: {
  value: number;
  kind: 'money' | 'qty';
  color: string;
  mutedColor: string;
}) {
  if (kind === 'qty') {
    return (
      <View style={styles.qtyFooterRow}>
        <Text style={[styles.qtyFooterValue, { color }, textLtr]}>{numberText(Math.round(value))}</Text>
        <Text style={[styles.qtyFooterUnit, { color: mutedColor }]}>وحدة</Text>
      </View>
    );
  }
  return <CurrencyAmount value={value} color={color} mutedColor={mutedColor} />;
}

export function RevenueTrendChart({
  days,
  revenue,
  title = 'اتجاه الإيرادات',
  hint = 'آخر 30 يومًا — متابعة سريعة للأداء.',
  badge,
  compact,
  variant = 'bar',
  valueKind = 'money',
}: Props) {
  const c = useColors();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const isPortrait = screenHeight > screenWidth;
  const [containerWidth, setContainerWidth] = useState(0);

  const axisDates = useMemo(() => days.map((day) => parseAxisDate(day)), [days]);

  const dateRangeLabel = useMemo(() => {
    if (!days.length) return null;
    const first = formatAxisRangeLabel(days[0]);
    const last = formatAxisRangeLabel(days[days.length - 1]);
    if (first === last) return first;
    return `${first} → ${last}`;
  }, [days]);

  const values = useMemo(() => revenue.map((n) => Number(n) || 0), [revenue]);
  const peak = useMemo(() => Math.max(...values, 0), [values]);
  const total = useMemo(() => values.reduce((s, n) => s + n, 0), [values]);
  const maxScale = peak * 1.12 || 1;
  const empty = isEffectivelyEmpty(values);
  const sparseHint =
    !empty && values.filter((n) => n > 0).length < Math.max(3, Math.floor(days.length * 0.2))
      ? 'نشاط محدود خلال الفترة — قد تظهر البيانات متفرقة.'
      : null;

  const pointCount = Math.max(values.length, 1);
  const chartHeight = compact ? 140 : isPortrait ? 156 : 180;
  const yAxisWidth = isPortrait ? 50 : 46;
  const availablePlotWidth = Math.max(containerWidth - yAxisWidth - spacing.xs, 0);
  const minSlotWidth = compact ? 24 : 28;
  const fittedSlotWidth = availablePlotWidth > 0 ? availablePlotWidth / pointCount : minSlotWidth;
  const slotWidth = pointCount <= 14 ? Math.max(minSlotWidth, fittedSlotWidth) : minSlotWidth;
  const barWidth = Math.max(10, Math.min(compact ? 16 : 20, slotWidth * 0.56));
  const labelStep = labelStepForCount(pointCount, compact);
  const labeledIndices = useMemo(() => visibleLabelIndices(pointCount, labelStep), [pointCount, labelStep]);
  const plotWidth = Math.max(pointCount * slotWidth, availablePlotWidth);
  const scrollable = plotWidth > availablePlotWidth + 1;

  const linePoints = useMemo<ChartPoint[]>(
    () =>
      values.map((value, index) => ({
        x: isRtl
          ? plotWidth - (slotWidth * index + slotWidth / 2)
          : slotWidth * index + slotWidth / 2,
        y: chartHeight - (value / maxScale) * chartHeight,
        value,
      })),
    [chartHeight, maxScale, plotWidth, slotWidth, values],
  );
  const linePath = useMemo(() => buildSmoothPath(linePoints), [linePoints]);
  const areaPath = useMemo(() => {
    if (!linePath || !linePoints.length) return '';
    const first = linePoints[0];
    const last = linePoints[linePoints.length - 1];
    return `${linePath} L ${last.x} ${chartHeight} L ${first.x} ${chartHeight} Z`;
  }, [chartHeight, linePath, linePoints]);

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
            <View
              key={`grid-${tick}`}
              style={[styles.gridLine, { top, backgroundColor: c.borderSubtle }]}
            />
          );
        })}
        {variant === 'line' ? (
          <Svg width={plotWidth} height={chartHeight} style={styles.svgChart}>
            <Path d={areaPath} fill={c.info} fillOpacity={0.1} />
            <Path
              d={linePath}
              fill="none"
              stroke={c.info}
              strokeWidth={3.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {linePoints.map((point, index) =>
              point.value > 0 && (point.value === peak || pointCount <= 7) ? (
                <Circle
                  key={`point-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={4.5}
                  fill={c.surface}
                  stroke={c.info}
                  strokeWidth={3}
                />
              ) : null,
            )}
          </Svg>
        ) : (
          <View style={[styles.barsRow, { height: chartHeight }]}>
            {values.map((value, index) => {
              const barHeight = Math.max(value > 0 ? 4 : 0, (value / maxScale) * chartHeight);
              const isPeak = value === peak && value > 0;
              return (
                <View key={`bar-${index}`} style={[styles.barSlot, { width: slotWidth }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: barWidth,
                        height: barHeight,
                        backgroundColor: isPeak ? c.info : c.textCaption,
                        opacity: value > 0 ? (isPeak ? 1 : 0.78) : 0,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>
      <View style={[styles.datesRow, { minHeight: compact ? 40 : 44 }]}>
        {values.map((_, index) => {
          const parts = axisDates[index];
          const show = labeledIndices.has(index);
          return (
            <View key={`date-${index}`} style={[styles.dateSlot, { width: slotWidth }]}>
              {show && parts ? (
                <View style={styles.dateStack}>
                  <Text style={[styles.dateDay, { color: c.text }]}>{parts.day}</Text>
                  <Text style={[styles.dateMonth, { color: c.textMuted }]}>{parts.month}</Text>
                </View>
              ) : show ? (
                <Text style={[styles.dateFallback, { color: c.textMuted }]} numberOfLines={2}>
                  {formatAxisRangeLabel(days[index] ?? '')}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <DashboardSection
        title={title}
        hint={hint}
        icon="show-chart"
        iconTone="info"
        badge={badge ?? `${days.length} يوم`}
        badgeTone="info"
      >
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
          {empty ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: c.text }]}>لا توجد بيانات اتجاه للعرض</Text>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>ستظهر الإيرادات عند تسجيل مبيعات.</Text>
            </View>
          ) : (
            <>
              <View style={styles.chartShell} onLayout={onLayout}>
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
              </View>
              {dateRangeLabel ? (
                <Text style={[styles.rangeHint, { color: c.textMuted }]}>{dateRangeLabel}</Text>
              ) : null}
              <View style={[styles.footer, { borderTopColor: c.borderSubtle }]}>
                <View style={styles.footerItem}>
                  <Text style={[styles.footerLabel, { color: c.textMuted }]}>الإجمالي</Text>
                  <FooterValue value={total} kind={valueKind} color={c.text} mutedColor={c.textMuted} />
                </View>
                <View style={[styles.footerDivider, { backgroundColor: c.borderSubtle }]} />
                <View style={styles.footerItem}>
                  <Text style={[styles.footerLabel, { color: c.textMuted }]}>أعلى يوم</Text>
                  <FooterValue value={peak} kind={valueKind} color={c.text} mutedColor={c.textMuted} />
                </View>
              </View>
              {sparseHint ? <Text style={[styles.sparseHint, { color: c.textMuted }]}>{sparseHint}</Text> : null}
            </>
          )}
        </View>
      </DashboardSection>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  card: {
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
    overflow: 'hidden',
  },
  chartShell: {
    width: '100%',
    paddingTop: spacing.xs,
  },
  chartRow: {
    ...flexRow,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  yAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 44,
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
  barsRow: {
    ...flexRow,
    alignItems: 'flex-end',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  barSlot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    borderRadius: radius.pill,
    minHeight: 0,
  },
  svgChart: {
    position: 'absolute',
    start: 0,
    bottom: 0,
  },
  datesRow: {
    ...flexRow,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  dateSlot: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 1,
  },
  dateStack: {
    alignItems: 'center',
    gap: 1,
    minWidth: 32,
  },
  dateDay: {
    ...textLtr,
    fontSize: 12,
    fontFamily: fonts.bold,
    textAlign: 'center',
    lineHeight: 14,
  },
  dateMonth: {
    fontSize: 10,
    fontFamily: fonts.medium,
    textAlign: 'center',
    lineHeight: 12,
  },
  dateFallback: {
    fontSize: 10,
    fontFamily: fonts.medium,
    textAlign: 'center',
    maxWidth: 40,
  },
  rangeHint: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  qtyFooterRow: {
    ...flexRow,
    alignItems: 'center',
    gap: 4,
  },
  qtyFooterValue: {
    fontSize: typography.body,
    fontFamily: fonts.extraBold,
  },
  qtyFooterUnit: {
    fontSize: typography.caption,
    fontFamily: fonts.bold,
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
  empty: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.body,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.body,
    fontFamily: fonts.regular,
    textAlign: 'center',
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
    gap: spacing.xs,
  },
  footerDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  footerLabel: {
    fontSize: typography.caption,
    fontFamily: fonts.medium,
  },
  sparseHint: {
    marginTop: spacing.sm,
    fontSize: 11,
    fontFamily: fonts.regular,
    textAlign: 'center',
    ...textStart,
  },
});
