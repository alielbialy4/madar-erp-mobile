import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ProductInsightsMetric } from './ProductInsightsMetric';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { money } from '@/utils/format';
import { parseApiMoneyFirst } from '@/utils/parseMoney';
import type { Product } from '@/types/api';
import { Text } from '@/components/ui/AppText';

type Props = {
  product: Product;
  flat?: boolean;
};

export function ProductDetailVariantsSection({ product, flat }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const variants = product.variants ?? [];

  if (!variants.length) return null;

  const list = (
    <View style={styles.list}>
      {variants.map((v) => {
        const extra = parseApiMoneyFirst(v.additional_price);
        return (
          <View key={v.id} style={styles.row}>
            <Text style={styles.name} numberOfLines={2}>
              {v.name ?? 'متغير'}
            </Text>
            <View style={styles.metrics}>
              {v.sku ? (
                <View style={styles.skuBox}>
                  <Text style={styles.skuLabel}>SKU</Text>
                  <Text style={[styles.skuValue, textLtr]}>{v.sku}</Text>
                </View>
              ) : null}
              {extra != null && extra > 0 ? (
                <ProductInsightsMetric
                  compact
                  label="سعر إضافي"
                  value={money(extra).replace(' ج.م', '')}
                  kind="money"
                />
              ) : (
                <Text style={styles.noExtra}>بدون زيادة</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  if (flat) return list;

  return (
    <DashboardSection title="المتغيرات" hint="أحجام أو أنواع فرعية للمنتج" icon="category" iconTone="accent">
      {list}
    </DashboardSection>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    list: { gap: spacing.sm },
    row: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    name: {
      ...textStart,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
    },
    metrics: {
      ...flexRow,
      flexWrap: 'wrap',
      gap: spacing.sm,
      alignItems: 'center',
    },
    skuBox: { gap: 2 },
    skuLabel: { fontSize: typography.micro, color: c.textMuted, fontFamily: fonts.medium },
    skuValue: { fontSize: typography.small, fontFamily: fonts.bold, color: c.text },
    noExtra: { fontSize: typography.small, color: c.textMuted, fontFamily: fonts.medium },
  });
}
