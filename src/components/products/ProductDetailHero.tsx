import React, { useMemo } from 'react';
import { Text } from '@/components/ui/AppText';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { createDashboardStyles } from '@/components/dashboard/dashboardStyles';
import { useColors } from '@/hooks/useColors';
import { resolveMediaUrl } from '@/utils/media';
import { money, numberText } from '@/utils/format';
import type { Product } from '@/types/api';
import { getProductBadge, getProductPrices, getProductQuantity } from './productUtils';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type Props = {
  product: Product;
  canManage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onInsights?: () => void;
  large?: boolean;
};

export function ProductDetailHero({ product, canManage, onEdit, onDelete, onInsights, large }: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const local = useMemo(() => createLocalStyles(c, large), [c, large]);
  const thumb = resolveMediaUrl(product.image);
  const badge = getProductBadge(product);
  const prices = getProductPrices(product);
  const qty = getProductQuantity(product);

  const badgeTone =
    badge.tone === 'danger'
      ? 'danger'
      : badge.tone === 'warning'
        ? 'warning'
        : badge.tone === 'success'
          ? 'success'
          : badge.tone === 'info'
            ? 'info'
            : 'default';

  const chips = (
    <>
      {onInsights ? (
        <Pressable
          onPress={onInsights}
          style={({ pressed }) => [ds.actionChip, ds.actionChipOutline, pressed && { opacity: 0.9 }]}
        >
          <MaterialIcons name="insights" size={18} color={c.textMuted} />
          <Text style={[ds.actionChipText, { color: c.text }]}>تحليلات</Text>
        </Pressable>
      ) : null}
      {canManage && onEdit ? (
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [ds.actionChip, ds.actionChipPrimary, pressed && { opacity: 0.9 }]}
        >
          <MaterialIcons name="edit" size={18} color={c.primaryForeground} />
          <Text style={[ds.actionChipText, { color: c.primaryForeground }]}>تعديل</Text>
        </Pressable>
      ) : null}
      {canManage && onDelete ? (
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [ds.actionChip, { backgroundColor: c.surfaceMuted, borderColor: c.danger }, pressed && { opacity: 0.9 }]}
        >
          <MaterialIcons name="delete-outline" size={18} color={c.danger} />
          <Text style={[ds.actionChipText, { color: c.danger }]}>حذف</Text>
        </Pressable>
      ) : null}
    </>
  );

  return (
    <View style={ds.heroOuter}>
      <View style={ds.heroAccent} />
      <View style={ds.heroBody}>
        <View style={local.topRow}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={local.thumb} resizeMode="cover" />
          ) : (
            <View style={local.thumbPlaceholder}>
              <MaterialIcons name="inventory-2" size={36} color={c.textCaption} />
            </View>
          )}
          <View style={local.meta}>
            <Text style={ds.heroEyebrow}>{product.category?.name ?? 'بدون تصنيف'}</Text>
            <Text style={ds.heroTitle} numberOfLines={2}>
              {product.name}
            </Text>
            <View style={local.badges}>
              <AppBadge label={badge.label} tone={badgeTone} />
              {product.featured ? <AppBadge label="مميز" tone="info" /> : null}
            </View>
          </View>
        </View>

        <View style={local.priceBlock}>
          <Text style={local.priceLabel}>سعر البيع</Text>
          <View style={local.priceRow}>
            <Text style={local.priceValue}>{money(prices.display)}</Text>
            {prices.compare != null ? <Text style={local.priceOld}>{money(prices.compare)}</Text> : null}
          </View>
          <Text style={local.stockLine}>المتاح: {numberText(qty)}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ds.chipScroll}>
          {chips}
        </ScrollView>
      </View>
    </View>
  );
}

function createLocalStyles(c: ReturnType<typeof useColors>, large?: boolean) {
  const thumbSize = large ? 120 : 72;
  return StyleSheet.create({
    topRow: { ...flexRow, alignItems: 'flex-start', gap: spacing.md },
    thumb: { width: thumbSize, height: thumbSize, borderRadius: radius.xxl },
    thumbPlaceholder: {
      width: thumbSize,
      height: thumbSize,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceMuted,
    },
    meta: { flex: 1, minWidth: 0, gap: 4 },
    badges: { ...flexRow, flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
    priceBlock: {
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      gap: 4,
    },
    priceLabel: { ...textStart, fontSize: typography.tiny, fontFamily: fonts.medium, color: c.textMuted },
    priceRow: { ...flexRow, alignItems: 'baseline', gap: spacing.sm },
    priceValue: {
      fontSize: typography.pageTitle,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.accent,
      writingDirection: 'rtl',
    },
    priceOld: {
      fontSize: typography.small,
      fontFamily: fonts.medium,
      color: c.textCaption,
      textDecorationLine: 'line-through',
      writingDirection: 'rtl',
    },
    stockLine: { ...textStart, fontSize: typography.small, fontFamily: fonts.medium, color: c.text },
  });
}
