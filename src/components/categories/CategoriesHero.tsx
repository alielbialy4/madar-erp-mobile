import React from 'react';
import { ScrollView, View , useWindowDimensions } from 'react-native';
import { PremiumHeroPanel } from '@/components/layout/PremiumHeroPanel';
import { HeroActionChip } from '@/components/layout/HeroActionChip';
import { HeroStatPill } from '@/components/layout/HeroStatPill';
import { HeroRefreshFooter } from '@/components/layout/HeroRefreshFooter';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';

type Props = {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  productsTotal?: number;
  isLoading?: boolean;
  onRefresh: () => void;
  canManage: boolean;
  onAdd?: () => void;
  onReorder?: () => void;
  onProducts?: () => void;
  compact?: boolean;
  statsOnly?: boolean;
  showActions?: boolean;
};

export function CategoriesHero({
  totalCount,
  activeCount,
  inactiveCount,
  productsTotal = 0,
  isLoading,
  onRefresh,
  canManage,
  onAdd,
  onReorder,
  onProducts,
  compact: compactProp,
  statsOnly = false,
  showActions = false,
}: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const compact = compactProp ?? width < 600;

  const badges = (
    <>
      <HeroStatPill label="إجمالي" value={totalCount} compact />
      <HeroStatPill label="نشط" value={activeCount} tone="success" compact />
      <HeroStatPill label="غير نشط" value={inactiveCount} tone="warning" compact />
      {productsTotal > 0 ? (
        <HeroStatPill label="منتجات" value={productsTotal} compact />
      ) : null}
    </>
  );

  const actions = (
    <ScrollView
      horizontal={!isTablet}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ ...flexRow, gap: spacing.sm, flexWrap: isTablet ? 'wrap' : undefined }}
    >
      {onProducts ? (
        <HeroActionChip label="المنتجات" icon="inventory-2" onPress={onProducts} />
      ) : null}
      {canManage && onReorder ? (
        <HeroActionChip label="ترتيب POS" icon="swap-vert" onPress={onReorder} />
      ) : null}
      {canManage && onAdd ? (
        <HeroActionChip label="تصنيف جديد" icon="add" variant="primary" onPress={onAdd} />
      ) : null}
    </ScrollView>
  );

  if (statsOnly) {
    return (
      <View style={{ gap: spacing.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {badges}
        </ScrollView>
        {showActions ? actions : null}
        <HeroRefreshFooter
          metaText={`${totalCount} تصنيف في القائمة`}
          onRefresh={onRefresh}
          isLoading={isLoading}
        />
      </View>
    );
  }

  const rail = (
    <View style={{ width: '100%', gap: spacing.sm }}>
      <View style={{ width: '100%' }}>{actions}</View>
      <HeroRefreshFooter
        metaText={`${totalCount} تصنيف في القائمة`}
        onRefresh={onRefresh}
        isLoading={isLoading}
      />
    </View>
  );

  return (
    <PremiumHeroPanel
      eyebrow="الكتالوج"
      title="التصنيفات"
      subtitle="نظّم كتالوج المنتجات — الترتيب هنا يظهر في نقطة البيع."
      badges={badges}
      rail={rail}
      compact={compact}
      edgeInset={false}
    />
  );
}
