import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { money, numberText } from '@/utils/format';
import { ProductInsightsMetric, type MetricKind } from './ProductInsightsMetric';
import { spacing } from '@/constants/spacing';
import type { InsightsProduct } from '@/types/productInsights';

type MetaItem = {
  label: string;
  value: string;
  kind: MetricKind;
};

type Props = {
  product: InsightsProduct;
};

export function ProductInsightsMetaCard({ product }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;

  const items = useMemo((): MetaItem[] => {
    const rows: MetaItem[] = [];
    if (product.category?.name) rows.push({ label: 'التصنيف', value: product.category.name, kind: 'text' });
    if (product.barcode) rows.push({ label: 'الباركود', value: product.barcode, kind: 'text' });
    rows.push({
      label: 'سعر البيع الحالي',
      value: money(product.effective_price).replace(' ج.م', ''),
      kind: 'money',
    });
    if (product.is_promotional && product.promotional_price !== null) {
      rows.push({
        label: 'سعر العرض',
        value: money(product.promotional_price).replace(' ج.م', ''),
        kind: 'money',
      });
    }
    if (product.track_inventory) {
      rows.push({
        label: 'حد تنبيه المخزون',
        value: numberText(product.min_stock_alert),
        kind: 'qty',
      });
    }
    return rows;
  }, [product]);

  if (!items.length) return null;

  return (
    <DashboardSection title="معلومات المنتج" icon="info" iconTone="info" hint="بيانات ثابتة عن المنتج — ليست مرتبطة بالفترة">
      <View style={[styles.grid, isTablet && styles.gridTablet]}>
        {items.map((item) => (
          <View key={item.label} style={[styles.cell, isTablet && styles.cellTablet]}>
            <ProductInsightsMetric label={item.label} value={item.value} kind={item.kind} />
          </View>
        ))}
      </View>
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
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
