import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { resolveMediaUrl } from '@/utils/media';
import { money, numberText } from '@/utils/format';
import { chevronForwardIcon } from '@/utils/rtl';
import type { Product } from '@/types/api';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { getProductBadge, getProductPrices, getProductQuantity } from './productUtils';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';

type Props = {
  product: Product;
  canManage: boolean;
  onPress: () => void;
  onEdit?: () => void;
  onInsights?: () => void;
};

export function ProductListCard({ product, canManage, onPress, onEdit, onInsights }: Props) {
  const c = useColors();
  const styles = useMemo(() => createCategoryStyles(c), [c]);
  const extra = useMemo(() => createExtraStyles(c), [c]);
  const thumb = resolveMediaUrl(product.image);
  const badge = getProductBadge(product);
  const prices = getProductPrices(product);
  const qty = getProductQuantity(product);
  const bc = (product.barcodes ?? []).filter(Boolean).join('، ') || product.barcode || '—';

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

  return (
    <View style={styles.categoryCard}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.cardPressable, pressed && { opacity: 0.92 }]}>
        <View style={styles.cardTop}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <MaterialIcons name="inventory-2" size={28} color={c.textCaption} />
            </View>
          )}
          <View style={styles.cardBody}>
            <View style={extra.titleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {product.name}
              </Text>
              <AppBadge label={badge.label} tone={badgeTone} />
            </View>
            <Text style={styles.cardDesc} numberOfLines={1}>
              {product.category?.name ?? 'بدون تصنيف'}
            </Text>
            <View style={extra.priceRow}>
              <Text style={extra.priceMain}>{money(prices.display)}</Text>
              {prices.compare != null ? (
                <Text style={extra.priceCompare}>{money(prices.compare)}</Text>
              ) : null}
            </View>
            <Text style={styles.cardMeta}>
              باركود: {bc} • متاح: {numberText(qty)}
            </Text>
          </View>
          <View style={styles.cardChevron}>
            <MaterialIcons name={chevronForwardIcon()} size={22} color={c.textCaption} />
          </View>
        </View>
      </Pressable>

      {(canManage && onEdit) || onInsights ? (
        <View style={styles.cardActions}>
          {onInsights ? (
            <Pressable onPress={onInsights} style={styles.actionBtn}>
              <MaterialIcons name="insights" size={18} color={c.textMuted} />
              <Text style={styles.actionText}>تحليلات</Text>
            </Pressable>
          ) : null}
          {canManage && onEdit ? (
            <Pressable onPress={onEdit} style={[styles.actionBtn, styles.actionBtnPrimary]}>
              <MaterialIcons name="edit" size={18} color={c.accent} />
              <Text style={[styles.actionText, styles.actionTextPrimary]}>تعديل</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function createExtraStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    titleRow: { ...flexRow, alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
    priceRow: { ...textStart, ...flexRow, alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.xs },
    priceMain: {
      fontSize: typography.cardTitle,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.accent,
      writingDirection: 'rtl',
    },
    priceCompare: {
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textCaption,
      textDecorationLine: 'line-through',
      writingDirection: 'rtl',
    },
  });
}
