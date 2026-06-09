import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { DashboardKpiCard } from '@/components/dashboard/DashboardKpiCard';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { textStart } from '@/constants/layout';
import { money, numberText } from '@/utils/format';
import { formatReturnRate } from './productInsightsUtils';
import type { ProductInsightsPayload } from '@/types/productInsights';
import { Text } from '@/components/ui/AppText';

type Props = {
  payload: ProductInsightsPayload;
};

type KpiItem = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  icon: string;
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
};

function KpiGroup({ title, subtitle, items }: { title: string; subtitle?: string; items: KpiItem[] }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;

  return (
    <View style={groupStyles.wrap}>
      <View style={groupStyles.header}>
        <Text style={[groupStyles.groupTitle, { color: c.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[groupStyles.groupSubtitle, { color: c.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={[groupStyles.grid, isTablet && groupStyles.gridTablet]}>
        {items.map((item, index) => (
          <View key={item.key} style={[groupStyles.cell, isTablet && groupStyles.cellTablet]}>
            <DashboardKpiCard
              label={item.label}
              value={item.value}
              hint={item.hint}
              icon={item.icon}
              tone={item.tone}
              tier="secondary"
              index={index}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export function ProductInsightsKpiGrid({ payload }: Props) {
  const { product, inventory, sales, purchases, returns } = payload;

  const lowStock =
    product.track_inventory &&
    inventory.total_quantity > 0 &&
    product.min_stock_alert > 0 &&
    inventory.total_quantity <= product.min_stock_alert;
  const outOfStock = product.track_inventory && inventory.total_quantity <= 0;

  const stockHint = outOfStock ? 'نفد المخزون' : lowStock ? 'مخزون منخفض' : 'متوفر';
  const stockTone = outOfStock ? 'danger' : lowStock ? 'warning' : 'success';

  const inventoryItems = useMemo(
    (): KpiItem[] => [
      {
        key: 'qty',
        label: 'كمية المخزون الحالية',
        value: numberText(inventory.total_quantity),
        hint: stockHint,
        icon: 'package',
        tone: stockTone,
      },
      {
        key: 'branches',
        label: 'فروع بها مخزون',
        value: numberText(inventory.branches_count),
        icon: 'building',
        tone: 'neutral',
      },
      {
        key: 'warehouses',
        label: 'مخازن نشطة',
        value: numberText(inventory.warehouses_count),
        icon: 'warehouse',
        tone: 'neutral',
      },
    ],
    [inventory, stockHint, stockTone],
  );

  const periodItems = useMemo(
    (): KpiItem[] => [
      {
        key: 'sold',
        label: 'كمية مباعة',
        value: numberText(sales.qty_sold),
        hint: `إجمالي: ${money(sales.total_amount)}`,
        icon: 'trending-up',
        tone: 'success',
      },
      {
        key: 'purchased',
        label: 'كمية مشتراة',
        value: numberText(purchases.qty_purchased),
        hint: `تكلفة: ${money(purchases.total_cost)}`,
        icon: 'trending-down',
        tone: 'warning',
      },
      {
        key: 'returned',
        label: 'كمية مرتجعة',
        value: numberText(returns.qty_refunded),
        hint: `نسبة: ${formatReturnRate(returns.return_rate)}`,
        icon: 'refresh',
        tone: 'danger',
      },
      {
        key: 'avg-sale',
        label: 'متوسط البيع / وحدة',
        value: money(sales.avg_unit_price),
        icon: 'tag',
        tone: 'info',
      },
      {
        key: 'avg-cost',
        label: 'متوسط الشراء / وحدة',
        value: money(purchases.avg_unit_cost),
        icon: 'receipt',
        tone: 'warning',
      },
    ],
    [sales, purchases, returns],
  );

  return (
    <DashboardSection
      title="نظرة سريعة"
      hint="أرقام المخزون = الآن · أرقام المبيعات والمشتريات = الفترة المحددة أعلاه"
      icon="insights"
      iconTone="accent"
    >
      <KpiGroup title="المخزون الآن" subtitle="الكميات الحالية في الفروع والمخازن" items={inventoryItems} />
      <KpiGroup title="حركة الفترة" subtitle="مجموع ما حدث بين تاريخي البداية والنهاية" items={periodItems} />
    </DashboardSection>
  );
}

const groupStyles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  header: {
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  groupTitle: {
    ...textStart,
    fontSize: typography.body,
    fontFamily: fonts.bold,
  },
  groupSubtitle: {
    ...textStart,
    fontSize: typography.micro,
    fontFamily: fonts.medium,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridTablet: {
    gap: spacing.md,
  },
  cell: {
    width: '48.5%',
    minWidth: 140,
  },
  cellTablet: {
    width: '31%',
    minWidth: 0,
  },
});
