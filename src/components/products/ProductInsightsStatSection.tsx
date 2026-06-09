import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { money, numberText, dateText } from '@/utils/format';
import { formatReturnRate } from './productInsightsUtils';
import { ProductInsightsMetric, type MetricKind } from './ProductInsightsMetric';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { textStart } from '@/constants/layout';
import type { InsightsPurchases, InsightsReturns, InsightsSales } from '@/types/productInsights';
import { Text } from '@/components/ui/AppText';

type StatItem = {
  label: string;
  value: string;
  kind: MetricKind;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
};

type Props =
  | { variant: 'sales'; sales: InsightsSales }
  | { variant: 'returns'; returns: InsightsReturns }
  | { variant: 'purchases'; purchases: InsightsPurchases };

export function ProductInsightsStatSection(props: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;

  const { title, hint, icon, iconTone, items } = useMemo(() => {
    if (props.variant === 'sales') {
      const { sales } = props;
      return {
        title: 'ملخص المبيعات',
        hint: 'كميات ومبالغ البيع ضمن الفترة المحددة',
        icon: 'trending-up',
        iconTone: 'success' as const,
        items: [
          { label: 'كمية مباعة', value: numberText(sales.qty_sold), kind: 'qty' as const, tone: 'success' as const },
          { label: 'إجمالي المبيعات', value: money(sales.total_amount).replace(' ج.م', ''), kind: 'money' as const, tone: 'success' as const },
          { label: 'متوسط سعر الوحدة', value: money(sales.avg_unit_price).replace(' ج.م', ''), kind: 'money' as const },
          { label: 'عدد الطلبات', value: numberText(sales.orders_count), kind: 'count' as const },
          { label: 'آخر عملية بيع', value: sales.last_sale_at ? dateText(sales.last_sale_at) : '—', kind: 'date' as const },
        ] satisfies StatItem[],
      };
    }
    if (props.variant === 'returns') {
      const { returns } = props;
      return {
        title: 'ملخص المرتجعات',
        hint: 'مرتجعات العملاء والموردين ضمن الفترة',
        icon: 'refresh',
        iconTone: 'danger' as const,
        items: [
          { label: 'كمية مرتجعة', value: numberText(returns.qty_refunded), kind: 'qty' as const, tone: 'danger' as const },
          { label: 'مبلغ الاسترداد', value: money(returns.refund_amount).replace(' ج.م', ''), kind: 'money' as const, tone: 'danger' as const },
          { label: 'نسبة المرتجع', value: formatReturnRate(returns.return_rate).replace('%', ''), kind: 'percent' as const, tone: 'warning' as const },
          { label: 'مرتجع للمورد', value: numberText(returns.qty_returned_to_supplier), kind: 'qty' as const },
          { label: 'آخر مرتجع', value: returns.last_return_at ? dateText(returns.last_return_at) : '—', kind: 'date' as const },
        ] satisfies StatItem[],
      };
    }
    const { purchases } = props;
    return {
      title: 'ملخص المشتريات',
      hint: 'كميات وتكاليف الشراء ضمن الفترة المحددة',
      icon: 'shopping-cart',
      iconTone: 'warning' as const,
      items: [
        { label: 'كمية مشتراة', value: numberText(purchases.qty_purchased), kind: 'qty' as const, tone: 'warning' as const },
        { label: 'إجمالي التكلفة', value: money(purchases.total_cost).replace(' ج.م', ''), kind: 'money' as const, tone: 'warning' as const },
        { label: 'متوسط تكلفة الوحدة', value: money(purchases.avg_unit_cost).replace(' ج.م', ''), kind: 'money' as const },
        { label: 'عدد فواتير الشراء', value: numberText(purchases.purchase_count), kind: 'count' as const },
        { label: 'آخر عملية شراء', value: purchases.last_purchase_at ? dateText(purchases.last_purchase_at) : '—', kind: 'date' as const },
      ] satisfies StatItem[],
    };
  }, [props]);

  return (
    <DashboardSection title={title} hint={hint} icon={icon} iconTone={iconTone}>
      <Text style={[styles.legend, { color: c.textCaption }]}>
        الوحدة = قطعة مباعة/مشتراة · ج.م = مبلغ بالجنيه
      </Text>
      <View style={[styles.grid, isTablet && styles.gridTablet]}>
        {items.map((item) => (
          <View key={item.label} style={[styles.cell, isTablet && styles.cellTablet]}>
            <ProductInsightsMetric
              label={item.label}
              value={item.value}
              kind={item.kind}
              tone={item.tone}
            />
          </View>
        ))}
      </View>
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  legend: {
    ...textStart,
    fontSize: typography.micro,
    fontFamily: fonts.medium,
    marginBottom: spacing.sm,
  },
  grid: {
    gap: spacing.sm,
  },
  gridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cell: {
    width: '100%',
  },
  cellTablet: {
    width: '48%',
  },
});
