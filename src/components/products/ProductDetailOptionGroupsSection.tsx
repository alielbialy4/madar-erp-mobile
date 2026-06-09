import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { AppBadge } from '@/components/ui';
import { flexRow, textStart } from '@/constants/layout';
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

function selectionLabel(type: string): string {
  return type === 'multiple' ? 'اختيار متعدد' : 'اختيار واحد';
}

function pricingLabel(type: string): string {
  switch (type) {
    case 'per_option':
      return 'سعر لكل خيار';
    case 'group_price':
      return 'سعر للمجموعة';
    default:
      return 'مجاني';
  }
}

export function ProductDetailOptionGroupsSection({ product, flat }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const groups = product.option_groups ?? [];

  if (!groups.length) return null;

  const list = (
    <View style={styles.list}>
      {groups.map((g) => (
        <View key={g.id} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{g.title ?? g.name ?? 'مجموعة'}</Text>
            <View style={styles.badges}>
              <AppBadge label={g.is_required ? 'إلزامي' : 'اختياري'} tone={g.is_required ? 'warning' : 'neutral'} />
              <AppBadge label={selectionLabel(g.selection_type)} tone="info" />
            </View>
          </View>
          <Text style={styles.meta}>{pricingLabel(g.pricing_type)}</Text>
          {g.group_price != null && g.pricing_type === 'group_price' ? (
            <Text style={styles.groupPrice}>سعر المجموعة: {money(parseApiMoneyFirst(g.group_price) ?? 0)}</Text>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsRow}>
            {(g.options ?? []).map((opt) => {
              const price = parseApiMoneyFirst(opt.price);
              const label = price != null && price > 0 ? `${opt.name} (+${money(price)})` : opt.name;
              return (
                <View key={opt.id} style={styles.optionChip}>
                  <Text style={styles.optionText}>{label}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ))}
    </View>
  );

  if (flat) return list;

  return (
    <DashboardSection title="خيارات / موديفايرز" hint="مجموعات الخيارات في نقطة البيع" icon="tune" iconTone="info">
      {list}
    </DashboardSection>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    list: { gap: spacing.md },
    card: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    header: {
      ...flexRow,
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    title: {
      ...textStart,
      flex: 1,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
    },
    badges: { ...flexRow, gap: spacing.xs, flexWrap: 'wrap' },
    meta: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
    groupPrice: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      color: c.success,
    },
    optionsRow: { ...flexRow, gap: spacing.sm, paddingVertical: spacing.xs },
    optionChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    optionText: {
      fontSize: typography.small,
      fontFamily: fonts.medium,
      color: c.text,
    },
  });
}
