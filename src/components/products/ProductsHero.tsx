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
  lowStockCount: number;
  outOfStockCount: number;
  promoCount: number;
  isLoading?: boolean;
  onRefresh: () => void;
  canManage: boolean;
  onAdd?: () => void;
  onReorder?: () => void;
  onCategories?: () => void;
  categoryHint?: string | null;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  addLabel?: string;
  statLabels?: {
    total?: string;
    low?: string;
    out?: string;
    promo?: string;
    metaSuffix?: string;
  };
  compact?: boolean;
  /** Light stats row only — no PremiumHeroPanel (phone list header). */
  statsOnly?: boolean;
  /** Show action chips under stats row when statsOnly. */
  showActions?: boolean;
};

export function ProductsHero({
  totalCount,
  lowStockCount,
  outOfStockCount,
  promoCount,
  isLoading,
  onRefresh,
  canManage,
  onAdd,
  onReorder,
  onCategories,
  categoryHint,
  eyebrow = 'الكتالوج',
  title = 'المنتجات',
  subtitle,
  addLabel = 'منتج جديد',
  statLabels,
  compact: compactProp,
  statsOnly = false,
  showActions = false,
}: Props) {
  const { width } = useWindowDimensions();
  const compact = compactProp ?? width < 600;

  const resolvedSubtitle =
    subtitle ??
    (categoryHint
      ? `عرض منتجات تصنيف «${categoryHint}» — الأسعار والمخزون حسب الفرع الحالي.`
      : 'إدارة الأسعار والباركود والمخزون — الترتيب يظهر في نقطة البيع.');

  const badges = (
    <>
      <HeroStatPill label={statLabels?.total ?? 'محمّل'} value={totalCount} compact />
      <HeroStatPill label={statLabels?.low ?? 'منخفض'} value={lowStockCount} tone="warning" compact />
      <HeroStatPill label={statLabels?.out ?? 'نفد'} value={outOfStockCount} tone="danger" compact />
      <HeroStatPill label={statLabels?.promo ?? 'عروض'} value={promoCount} tone="success" compact />
    </>
  );

  const actions = (
    <View style={{ ...flexRow, gap: spacing.sm, flexWrap: 'wrap', width: '100%' }}>
      {onCategories ? (
        <HeroActionChip label="التصنيفات" icon="category" onPress={onCategories} fill />
      ) : null}
      {canManage && onReorder ? (
        <HeroActionChip label="ترتيب POS" icon="swap-vert" onPress={onReorder} fill />
      ) : null}
      {canManage && onAdd ? (
        <HeroActionChip label={addLabel} icon="add" variant="primary" onPress={onAdd} fill />
      ) : null}
    </View>
  );

  const metaSuffix = statLabels?.metaSuffix ?? 'منتج في القائمة';

  if (statsOnly) {
    return (
      <View style={{ gap: spacing.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {badges}
        </ScrollView>
        {showActions ? actions : null}
        <HeroRefreshFooter
          metaText={`${totalCount} ${metaSuffix}`}
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
        metaText={`${totalCount} ${metaSuffix}`}
        onRefresh={onRefresh}
        isLoading={isLoading}
      />
    </View>
  );

  return (
    <PremiumHeroPanel
      eyebrow={eyebrow}
      title={title}
      subtitle={resolvedSubtitle}
      badges={badges}
      rail={rail}
      compact={compact}
      edgeInset={false}
    />
  );
}
