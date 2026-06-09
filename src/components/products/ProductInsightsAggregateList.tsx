import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { AppBadge } from '@/components/ui';
import { money, numberText } from '@/utils/format';
import { ProductInsightsMetric } from './ProductInsightsMetric';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { InsightsBranchAggregate, InsightsSupplierAggregate } from '@/types/productInsights';
import { Text } from '@/components/ui/AppText';

type Props =
  | {
      variant: 'top_branch';
      row: InsightsBranchAggregate;
    }
  | {
      variant: 'by_branch';
      title?: string;
      rows: InsightsBranchAggregate[];
    }
  | {
      variant: 'top_suppliers';
      rows: InsightsSupplierAggregate[];
    };

function AggregateRow({
  name,
  qty,
  amount,
  rank,
}: {
  name: string;
  qty: number;
  amount: number;
  rank?: number;
}) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const styles = useMemo(() => createRowStyles(c), [c]);

  return (
    <View style={styles.row}>
      <View style={styles.nameRow}>
        {rank != null ? <Text style={styles.rank}>#{rank}</Text> : null}
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
      </View>
      <View style={[styles.metrics, isTablet && styles.metricsTablet]}>
        <View style={styles.metricBox}>
          <ProductInsightsMetric
            compact
            label="الكمية"
            value={numberText(qty)}
            kind="qty"
            tone="info"
          />
        </View>
        <View style={styles.metricBox}>
          <ProductInsightsMetric
            compact
            label="المبلغ"
            value={money(amount).replace(' ج.م', '')}
            kind="money"
            tone="success"
          />
        </View>
      </View>
    </View>
  );
}

export function ProductInsightsAggregateList(props: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;

  if (props.variant === 'top_branch') {
    const { row } = props;
    return (
      <DashboardSection title="أعلى فرع مبيعاً" icon="star" iconTone="success" hint="الفرع الأكثر مبيعاً للمنتج في الفترة">
        <View style={topStyles.wrap}>
          <AppBadge label={row.branch_name ?? '—'} tone="success" />
          <View style={[topStyles.metrics, isTablet && topStyles.metricsTablet]}>
            <View style={topStyles.metricBox}>
              <ProductInsightsMetric
                label="كمية مباعة"
                value={numberText(row.qty)}
                kind="qty"
                tone="success"
              />
            </View>
            <View style={topStyles.metricBox}>
              <ProductInsightsMetric
                label="إجمالي المبيعات"
                value={money(row.amount).replace(' ج.م', '')}
                kind="money"
                tone="success"
              />
            </View>
          </View>
        </View>
      </DashboardSection>
    );
  }

  if (props.variant === 'top_suppliers') {
    if (!props.rows.length) return null;
    return (
      <DashboardSection title="أعلى الموردين" icon="truck" iconTone="warning" hint="ترتيب حسب حجم الشراء في الفترة">
        <View style={listStyles.list}>
          {props.rows.map((row, index) => (
            <AggregateRow
              key={String(row.supplier_id ?? row.supplier_name ?? row.qty)}
              rank={index + 1}
              name={row.supplier_name ?? '—'}
              qty={row.qty}
              amount={row.amount}
            />
          ))}
        </View>
      </DashboardSection>
    );
  }

  if (!props.rows.length) return null;
  const title = props.title ?? 'حسب الفرع';

  return (
    <DashboardSection title={title} icon="building" iconTone="info" hint="كل صف: كمية منفصلة عن المبلغ بالجنيه">
      <View style={listStyles.list}>
        {props.rows.map((row) => (
          <AggregateRow
            key={String(row.branch_id ?? row.branch_name ?? row.qty)}
            name={row.branch_name ?? '—'}
            qty={row.qty}
            amount={row.amount}
          />
        ))}
      </View>
    </DashboardSection>
  );
}

const topStyles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  metrics: {
    gap: spacing.sm,
  },
  metricsTablet: {
    ...flexRow,
    gap: spacing.md,
  },
  metricBox: {
    flex: 1,
    minWidth: 0,
  },
});

const listStyles = StyleSheet.create({
  list: { gap: spacing.sm },
});

function createRowStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: {
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    nameRow: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
    },
    rank: {
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.accent,
      width: 32,
    },
    name: {
      ...textStart,
      flex: 1,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
    },
    metrics: {
      gap: spacing.sm,
    },
    metricsTablet: {
      ...flexRow,
    },
    metricBox: {
      flex: 1,
      minWidth: 0,
    },
  });
}
