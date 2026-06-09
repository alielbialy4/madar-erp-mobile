import React, { useMemo } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PremiumHeroPanel } from '@/components/layout/PremiumHeroPanel';
import { HeroRefreshFooter } from '@/components/layout/HeroRefreshFooter';
import { HeroStatPill } from '@/components/layout/HeroStatPill';
import { AppBadge } from '@/components/ui';
import { flexRow } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { resolveMediaUrl } from '@/utils/media';
import type { InsightsProduct, ViewMode } from '@/types/productInsights';
import { deriveStockHeroLabel, deriveStockHeroTone } from './productInsightsUtils';

type Props = {
  product: InsightsProduct;
  viewMode: ViewMode;
  branchName?: string | null;
  totalQuantity?: number;
  onRefresh?: () => void;
  isLoading?: boolean;
  loading?: boolean;
  lastUpdatedAt?: Date | null;
  edgeInset?: boolean;
};

export function ProductInsightsHero({
  product,
  viewMode,
  branchName,
  totalQuantity,
  onRefresh,
  isLoading,
  loading,
  lastUpdatedAt,
  edgeInset = false,
}: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const styles = useMemo(() => createStyles(c, isTablet), [c, isTablet]);
  const thumb = resolveMediaUrl(product.image);
  const showThumbSkeleton = loading && !thumb;

  const modeLabel =
    viewMode === 'global'
      ? 'عرض عام'
      : branchName
        ? `فرع · ${branchName}`
        : 'عرض الفرع';

  const subtitle = product.barcode
    ? `الباركود: ${product.barcode}`
    : 'مبيعات ومشتريات ومخزون وحركات ضمن الفترة المحددة.';

  const qty = totalQuantity ?? 0;
  const stockLabel = deriveStockHeroLabel(product.track_inventory, qty, product.min_stock_alert);
  const stockTone = deriveStockHeroTone(product.track_inventory, qty, product.min_stock_alert);

  const lastUpdatedLabel = useMemo(
    () =>
      lastUpdatedAt
        ? `آخر تحديث ${lastUpdatedAt.toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}`
        : undefined,
    [lastUpdatedAt],
  );

  const badges = (
    <>
      <AppBadge label={modeLabel} tone={viewMode === 'global' ? 'info' : 'neutral'} />
      {product.category?.name ? (
        <HeroStatPill label="التصنيف" value={product.category.name} compact />
      ) : null}
      {stockLabel ? (
        <HeroStatPill label="المخزون" value={stockLabel} tone={stockTone} compact />
      ) : null}
      {product.track_inventory && !stockLabel ? (
        <HeroStatPill
          label="حد التنبيه"
          value={product.min_stock_alert}
          tone={product.min_stock_alert > 0 ? 'warning' : 'default'}
          compact
        />
      ) : null}
      {product.is_promotional ? <HeroStatPill label="عرض" value="نعم" tone="success" compact /> : null}
    </>
  );

  const rail = onRefresh ? (
    <HeroRefreshFooter
      metaText={lastUpdatedLabel}
      onRefresh={onRefresh}
      isLoading={isLoading}
      refreshLabel="تحديث البيانات"
    />
  ) : null;

  return (
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
          eyebrow="تحليلات المنتج"
          title={product.name}
          subtitle={subtitle}
          badges={badges}
          rail={rail}
          edgeInset={edgeInset}
        />
      </View>
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>, isTablet: boolean) {
  const thumbSize = isTablet ? 96 : 72;
  return StyleSheet.create({
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
    thumb: {
      width: '100%',
      height: '100%',
    },
    thumbPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbSkeleton: {
      backgroundColor: c.surfaceMuted,
      opacity: 0.7,
    },
    panel: {
      flex: 1,
      minWidth: 0,
    },
  });
}
