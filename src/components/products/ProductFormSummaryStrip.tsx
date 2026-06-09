import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { INVENTORY_MODE_HINTS } from './productFormLabels';
import { estimateTotalRecipeCost } from './productFormUtils';
import type { ProductFormState } from '@/hooks/useProductForm';
import { money } from '@/utils/format';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';

type Props = {
  form: ProductFormState;
};

export function ProductFormSummaryStrip({ form }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const displayName = form.name.trim() || (form.rawMaterialMode ? 'خامة جديدة' : 'منتج جديد');
  const modeLabel = form.rawMaterialMode
    ? 'خامة'
    : (INVENTORY_MODE_HINTS[form.inventoryMode]?.title ?? form.inventoryMode);

  const recipeCount = form.recipes.filter((r) => r.ingredient_product_id).length;
  const recipeCost =
    form.recipeCostPreview ?? estimateTotalRecipeCost(form.recipes) ?? null;

  const modifierCount = form.optionGroups.filter((g) => g.title.trim()).length;

  return (
    <View style={styles.strip}>
      <Text style={styles.name} numberOfLines={1}>
        {displayName}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{modeLabel}</Text>
        </View>
        {form.isEdit ? (
          <View style={[styles.chip, { backgroundColor: c.borderSubtle }]}>
            <Text style={[styles.chipText, { color: c.textMuted }]}>تعديل</Text>
          </View>
        ) : null}
        {recipeCount > 0 ? (
          <Text style={styles.hint}>
            {recipeCount} مكون{recipeCost != null ? ` · ${money(recipeCost)}` : ''}
          </Text>
        ) : null}
        {modifierCount > 0 ? (
          <Text style={styles.hint}>{modifierCount} مجموعة خيارات</Text>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    strip: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.softPrimary,
      borderWidth: 1,
      borderColor: c.accentBorder,
    },
    name: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.bold,
      color: c.text,
    },
    metaRow: {
      ...flexRow,
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: c.accent + '18',
    },
    chipText: {
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      color: c.accent,
    },
    hint: {
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textMuted,
    },
  });
}
