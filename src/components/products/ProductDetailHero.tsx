import React, { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PremiumHeroPanel } from '@/components/layout/PremiumHeroPanel';
import { HeroStatPill } from '@/components/layout/HeroStatPill';
import { HeroActionChip } from '@/components/layout/HeroActionChip';
import { AppBadge } from '@/components/ui';
import { Text } from '@/components/ui/AppText';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import {
  HERO_CHIP_BG_SUBTLE,
  HERO_CHIP_BORDER_STRONG,
  HERO_MUTED_FG,
} from '@/constants/dashboardHeroTheme';
import { useColors } from '@/hooks/useColors';
import { resolveMediaUrl } from '@/utils/media';
import { money, numberText } from '@/utils/format';
import type { Product } from '@/types/api';
import { getProductBadge, getProductPrices, getProductQuantity } from './productUtils';

type Props = {
  product: Product;
  canManage: boolean;
  isRawMaterial?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onInsights?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  loading?: boolean;
  lastUpdatedAt?: Date | null;
};

export function ProductDetailHero({
  product,
  canManage,
  isRawMaterial,
  onEdit,
  onDelete,
  onInsights,
  onRefresh,
  isLoading,
  loading,
  lastUpdatedAt,
}: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const styles = useMemo(() => createStyles(c, isTablet), [c, isTablet]);
  const thumb = resolveMediaUrl(product.image);
  const showThumbSkeleton = loading && !thumb;
  const badge = getProductBadge(product);
  const prices = getProductPrices(product);
  const qty = getProductQuantity(product);
  const showSellingPrice = !isRawMaterial && product.is_sellable !== false;

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

  const lastUpdatedLabel = useMemo(
    () =>
      lastUpdatedAt
        ? `آخر تحديث ${lastUpdatedAt.toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}`
        : undefined,
    [lastUpdatedAt],
  );

  const subtitle = product.barcode
    ? `الباركود: ${product.barcode}`
    : isRawMaterial
      ? 'خامة / مادة — تفاصيل التكلفة والمخزون.'
      : 'تفاصيل المنتج — التسعير والمخزون والخيارات.';

  const badges = (
    <>
      <AppBadge label={badge.label} tone={badgeTone} />
      {product.featured ? <AppBadge label="مميز" tone="info" /> : null}
      {product.category?.name ? (
        <HeroStatPill label="التصنيف" value={product.category.name} compact />
      ) : null}
      {showSellingPrice ? (
        <HeroStatPill
          label={prices.isPromo ? 'سعر العرض' : 'سعر البيع'}
          value={money(prices.display).replace(' ج.م', '')}
          tone={prices.isPromo ? 'success' : 'default'}
          compact
        />
      ) : null}
      {product.track_inventory !== false && product.inventory_mode !== 'non_stock' ? (
        <HeroStatPill
          label="المتاح"
          value={numberText(qty)}
          tone={badge.tone === 'danger' ? 'danger' : badge.tone === 'warning' ? 'warning' : 'success'}
          compact
        />
      ) : null}
    </>
  );

  const hasActions = Boolean(onInsights || (canManage && (onEdit || onDelete)) || onRefresh);

  return (
    <View style={styles.container}>
      <View style={styles.wrap}>
        {showThumbSkeleton ? (
          <View style={[styles.thumbWrap, styles.thumbSkeleton]} />
        ) : thumb ? (
          <View style={styles.thumbWrap}>
            <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
          </View>
        ) : (
          <View style={[styles.thumbWrap, styles.thumbPlaceholder]}>
            <MaterialIcons name="inventory-2" size={isTablet ? 36 : 32} color={c.textMuted} />
          </View>
        )}
        <View style={styles.panel}>
          <PremiumHeroPanel
            eyebrow={isRawMaterial ? 'خامة' : 'المنتج'}
            title={product.name}
            subtitle={subtitle}
            badges={badges}
            edgeInset={false}
          />
        </View>
      </View>

      {hasActions ? (
        <View style={styles.actionsBlock}>
          <View style={styles.actionsRow}>
            {onInsights ? (
              <HeroActionChip label="تحليلات" icon="insights" variant="primary" fill onPress={onInsights} />
            ) : null}
            {canManage && onEdit ? (
              <HeroActionChip label="تعديل" icon="edit" fill onPress={onEdit} />
            ) : null}
            {canManage && onDelete ? (
              <HeroActionChip label="حذف" icon="delete-outline" fill onPress={onDelete} />
            ) : null}
            {onRefresh ? (
              <Pressable
                onPress={onRefresh}
                disabled={isLoading}
                style={({ pressed }) => [styles.refreshChip, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel="تحديث"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={c.sidebarForeground} />
                ) : (
                  <MaterialIcons name="refresh" size={20} color={c.sidebarForeground} />
                )}
              </Pressable>
            ) : null}
          </View>
          {lastUpdatedLabel ? <Text style={styles.meta}>{lastUpdatedLabel}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>, isTablet: boolean) {
  const thumbSize = isTablet ? 96 : 72;
  return StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    wrap: {
      ...flexRow,
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    thumbWrap: {
      width: thumbSize,
      height: thumbSize,
      borderRadius: radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surfaceMuted,
    },
    thumb: { width: '100%', height: '100%' },
    thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    thumbSkeleton: { opacity: 0.7 },
    panel: { flex: 1, minWidth: 0 },
    actionsBlock: {
      gap: spacing.xs,
    },
    actionsRow: {
      ...flexRow,
      gap: spacing.sm,
      width: '100%',
      alignItems: 'stretch',
    },
    refreshChip: {
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.xl,
      backgroundColor: HERO_CHIP_BG_SUBTLE,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: HERO_CHIP_BORDER_STRONG,
    },
    meta: {
      ...textStart,
      fontSize: typography.micro,
      fontFamily: fonts.medium,
      color: HERO_MUTED_FG,
      paddingHorizontal: spacing.xs,
    },
  });
}
