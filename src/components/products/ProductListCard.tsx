import React, { useMemo } from 'react';
import { Text } from '@/components/ui/AppText';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { resolveMediaUrl } from '@/utils/media';
import { money, numberText } from '@/utils/format';
import { chevronForwardIcon } from '@/utils/rtl';
import type { Product } from '@/types/api';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { getProductBadge, getProductPrices, getProductQuantity } from './productUtils';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';

type CardVariant = 'full' | 'compact' | 'grid';

type Props = {
  product: Product;
  canManage: boolean;
  onPress: () => void;
  onEdit?: () => void;
  onInsights?: () => void;
  variant?: CardVariant;
};

export function ProductListCard({
  product,
  canManage,
  onPress,
  onEdit,
  onInsights,
  variant = 'compact',
}: Props) {
  const c = useColors();
  const styles = useMemo(() => createCategoryStyles(c), [c]);
  const extra = useMemo(() => createExtraStyles(c), [c]);
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

  const handleLongPress = canManage && onEdit ? onEdit : undefined;

  if (variant === 'grid') {
    return (
      <View style={[styles.categoryCard, extra.gridCard]}>
        <Pressable
          onPress={onPress}
          onLongPress={handleLongPress}
          style={({ pressed }) => [extra.gridPressable, pressed && { opacity: 0.92 }]}
        >
          {thumb ? (
            <Image source={{ uri: thumb }} style={extra.gridThumb} resizeMode="cover" />
          ) : (
            <View style={extra.gridThumbPlaceholder}>
              <MaterialIcons name="inventory-2" size={32} color={c.textCaption} />
            </View>
          )}
          <Text style={extra.gridTitle} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={extra.gridPrice}>{money(prices.display)}</Text>
          <View style={extra.gridFooter}>
            <AppBadge label={badge.label} tone={badgeTone} />
            <Text style={extra.gridQty}>{numberText(qty)}</Text>
          </View>
        </Pressable>
      </View>
    );
  }

  const showActions = variant === 'full' && ((canManage && onEdit) || onInsights);
  const showChevron = variant === 'full';
  const showBarcode = variant === 'full';

  return (
    <View style={styles.categoryCard}>
      <Pressable
        onPress={onPress}
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.cardPressable,
          variant === 'compact' && extra.compactPressable,
          pressed && { opacity: 0.92 },
        ]}
      >
        <View style={styles.cardTop}>
          {thumb ? (
            <Image
              source={{ uri: thumb }}
              style={[styles.thumb, variant === 'compact' && extra.compactThumb]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbPlaceholder, variant === 'compact' && extra.compactThumb]}>
              <MaterialIcons name="inventory-2" size={variant === 'compact' ? 22 : 28} color={c.textCaption} />
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
              {variant === 'compact' ? ` • ${numberText(qty)} متاح` : ''}
            </Text>
            <View style={extra.priceRow}>
              <Text style={[extra.priceMain, variant === 'compact' && extra.priceMainCompact]}>
                {money(prices.display)}
              </Text>
              {prices.compare != null ? (
                <Text style={extra.priceCompare}>{money(prices.compare)}</Text>
              ) : null}
            </View>
            {showBarcode ? (
              <Text style={styles.cardMeta}>
                باركود: {(product.barcodes ?? []).filter(Boolean).join('، ') || product.barcode || '—'} • متاح: {numberText(qty)}
              </Text>
            ) : null}
          </View>
          {showChevron ? (
            <View style={styles.cardChevron}>
              <MaterialIcons name={chevronForwardIcon()} size={22} color={c.textCaption} />
            </View>
          ) : null}
        </View>
      </Pressable>

      {showActions ? (
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
      fontSize: typography.body,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.text,
      writingDirection: 'rtl',
    },
    priceMainCompact: {
      fontSize: typography.body,
    },
    priceCompare: {
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textCaption,
      textDecorationLine: 'line-through',
      writingDirection: 'rtl',
    },
    compactPressable: {
      minHeight: 76,
    },
    compactThumb: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
    },
    gridCard: {
      flex: 1,
      marginBottom: 0,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    gridPressable: {
      padding: spacing.md,
      gap: spacing.sm,
      flex: 1,
    },
    gridThumb: {
      width: '100%',
      height: 96,
      borderRadius: radius.lg,
    },
    gridThumbPlaceholder: {
      width: '100%',
      height: 96,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceMuted,
    },
    gridTitle: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
      minHeight: 36,
    },
    gridPrice: {
      ...textStart,
      fontSize: typography.body,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.text,
      writingDirection: 'rtl',
    },
    gridFooter: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    gridQty: {
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
      writingDirection: 'rtl',
    },
  });
}
