import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { RevenueTrendChart } from '@/components/dashboard/RevenueTrendChart';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { numberText } from '@/utils/format';
import { flexRow, textStart, textLtr } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { ProductInsightsPayload } from '@/types/productInsights';
import { Text } from '@/components/ui/AppText';

type Props = {
  payload: ProductInsightsPayload;
};

type TimeChartCard = {
  days: string[];
  values: number[];
  title: string;
  hint: string;
  valueKind: 'money' | 'qty';
};

function isEffectivelyEmpty(values: number[]): boolean {
  return values.length === 0 || values.every((v) => !v || Number(v) === 0);
}

function StockBarList({ items, fillColor }: { items: { label: string; qty: number }[]; fillColor?: string }) {
  const c = useColors();
  const styles = useMemo(() => createBarStyles(c, fillColor), [c, fillColor]);
  const peak = Math.max(...items.map((i) => i.qty), 1);

  return (
    <View style={styles.list}>
      {items.map((item) => {
        const pct = Math.max((item.qty / peak) * 100, item.qty > 0 ? 4 : 0);
        return (
          <View key={item.label} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.qty}>{numberText(item.qty)}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function ProductInsightsCharts({ payload }: Props) {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 900;
  const isLandscape = width > height;
  const { sales, purchases, charts } = payload;

  const resolvedTimeCharts = useMemo((): TimeChartCard[] => {
    const cards: TimeChartCard[] = [];

    if (sales.by_day.length) {
      const amounts = sales.by_day.map((d) => d.amount);
      if (!isEffectivelyEmpty(amounts)) {
        cards.push({
          days: sales.by_day.map((d) => d.date),
          values: amounts,
          title: 'مبيعات عبر الزمن',
          hint: 'مبلغ المبيعات اليومي — مرّر أفقياً لقراءة كل التواريخ',
          valueKind: 'money',
        });
      }
      const qty = sales.by_day.map((d) => d.qty);
      if (!isEffectivelyEmpty(qty)) {
        cards.push({
          days: sales.by_day.map((d) => d.date),
          values: qty,
          title: 'كمية المبيعات يومياً',
          hint: 'عدد الوحدات المباعة — مرّر أفقياً لقراءة كل التواريخ',
          valueKind: 'qty',
        });
      }
    }

    if (purchases.by_day.length) {
      const amounts = purchases.by_day.map((d) => d.amount);
      if (!isEffectivelyEmpty(amounts)) {
        cards.push({
          days: purchases.by_day.map((d) => d.date),
          values: amounts,
          title: 'مشتريات عبر الزمن',
          hint: 'مبلغ المشتريات اليومي — مرّر أفقياً لقراءة كل التواريخ',
          valueKind: 'money',
        });
      }
      const qty = purchases.by_day.map((d) => d.qty);
      if (!isEffectivelyEmpty(qty)) {
        cards.push({
          days: purchases.by_day.map((d) => d.date),
          values: qty,
          title: 'كمية المشتريات يومياً',
          hint: 'عدد الوحدات المشتراة — مرّر أفقياً لقراءة كل التواريخ',
          valueKind: 'qty',
        });
      }
    }

    return cards;
  }, [sales.by_day, purchases.by_day]);

  const stockByBranch = useMemo(
    () => charts.stock_by_branch.filter((b) => b.qty > 0),
    [charts.stock_by_branch],
  );

  const stockByWarehouse = useMemo(
    () => charts.stock_by_warehouse.filter((w) => w.qty > 0),
    [charts.stock_by_warehouse],
  );

  if (!resolvedTimeCharts.length && !stockByBranch.length && !stockByWarehouse.length) return null;

  return (
    <View style={styles.wrap}>
      {resolvedTimeCharts.length > 0 ? (
        <View style={[styles.timeRow, isTablet && isLandscape && styles.timeRowLandscape]}>
          {resolvedTimeCharts.map((chart) => (
            <View
              key={chart.title}
              style={[styles.timeCell, isTablet && isLandscape && styles.timeCellLandscape]}
            >
              <RevenueTrendChart
                days={chart.days}
                revenue={chart.values}
                title={chart.title}
                hint={chart.hint}
                variant="bar"
                compact={!isTablet}
                valueKind={chart.valueKind}
              />
            </View>
          ))}
        </View>
      ) : null}

      {stockByBranch.length > 0 ? (
        <DashboardSection title="المخزون حسب الفرع" icon="bar-chart" iconTone="accent">
          <StockBarList items={stockByBranch.map((b) => ({ label: b.label, qty: b.qty }))} />
        </DashboardSection>
      ) : null}

      {stockByWarehouse.length > 0 ? (
        <DashboardSection title="المخزون حسب المخزن" icon="warehouse" iconTone="info">
          <StockBarList
            items={stockByWarehouse.map((w) => ({ label: w.label, qty: w.qty }))}
            fillColor={undefined}
          />
        </DashboardSection>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  timeRow: { gap: spacing.lg },
  timeRowLandscape: {
    ...flexRow,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  timeCell: { flex: 1 },
  timeCellLandscape: { flex: 1, minWidth: '45%' },
});

function createBarStyles(c: ReturnType<typeof useColors>, fillColor?: string) {
  return StyleSheet.create({
    list: { gap: spacing.sm },
    row: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
    },
    label: {
      ...textStart,
      width: 88,
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.text,
    },
    barTrack: {
      flex: 1,
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: radius.pill,
      backgroundColor: fillColor ?? c.accent,
    },
    qty: {
      width: 48,
      ...textLtr,
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      color: c.textMuted,
    },
  });
}
