import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ProductInsightsMetric } from './ProductInsightsMetric';
import { buildRecipeCostingFields } from './productDetailSections';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { numberText } from '@/utils/format';
import type { Product } from '@/types/api';
import { Text } from '@/components/ui/AppText';

type Props = {
  product: Product;
  flat?: boolean;
};

export function ProductDetailRecipeSection({ product, flat }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const recipes = product.recipes ?? [];
  const costingFields = buildRecipeCostingFields(product);

  if (!recipes.length && !costingFields.length) return null;

  const content = (
    <>
      {costingFields.length > 0 ? (
        <View style={styles.costingRow}>
          {costingFields.map((f) => (
            <View key={f.label} style={styles.costingCell}>
              <ProductInsightsMetric label={f.label} value={f.value} kind={f.kind} tone={f.tone} compact />
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.list}>
        {recipes.map((row) => {
          const name = row.ingredient_product?.name ?? `مكون #${row.ingredient_product_id}`;
          const unitName = row.unit?.name ?? '—';
          const waste = row.waste_percentage != null ? `${numberText(row.waste_percentage)}%` : '—';
          return (
            <View key={String(row.id ?? `${row.ingredient_product_id}-${row.quantity}`)} style={styles.row}>
              <Text style={styles.ingredientName} numberOfLines={2}>
                {name}
              </Text>
              <View style={styles.metrics}>
                <ProductInsightsMetric compact label="الكمية" value={numberText(row.quantity)} kind="qty" />
                <View style={styles.unitBox}>
                  <Text style={styles.unitLabel}>الوحدة</Text>
                  <Text style={styles.unitValue}>{unitName}</Text>
                </View>
                {row.waste_percentage != null ? (
                  <ProductInsightsMetric compact label="هالك" value={waste.replace('%', '')} kind="percent" />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  if (flat) return <View style={styles.flatWrap}>{content}</View>;

  return (
    <DashboardSection
      title="مكونات الوصفة"
      hint="الخامات المستخدمة في إنتاج المنتج"
      icon="restaurant"
      iconTone="warning"
    >
      {content}
    </DashboardSection>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    flatWrap: { gap: spacing.sm },
    costingRow: {
      ...flexRow,
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    costingCell: { flex: 1, minWidth: 120 },
    list: { gap: spacing.sm },
    row: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    ingredientName: {
      ...textStart,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
    },
    metrics: {
      ...flexRow,
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    unitBox: {
      padding: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      minWidth: 72,
      gap: 2,
    },
    unitLabel: {
      fontSize: typography.micro,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
    unitValue: {
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
    },
  });
}
