import React from 'react';
import { ScrollView, View } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { PremiumHeroPanel } from '@/components/layout/PremiumHeroPanel';
import { HeroActionChip } from '@/components/layout/HeroActionChip';
import { HeroStatPill } from '@/components/layout/HeroStatPill';
import { HeroRefreshFooter } from '@/components/layout/HeroRefreshFooter';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';

type Props = {
  totalCount: number;
  activeCount: number;
  inactiveCount?: number;
  productsTotal?: number;
  isLoading?: boolean;
  onRefresh: () => void;
  canManage: boolean;
  onAdd?: () => void;
  readOnlyHint?: string | null;
  compact?: boolean;
  statsOnly?: boolean;
  showActions?: boolean;
};

export function WarehousesHero({
  totalCount,
  activeCount,
  inactiveCount: inactiveProp,
  productsTotal = 0,
  isLoading,
  onRefresh,
  canManage,
  onAdd,
  readOnlyHint,
  compact: compactProp,
  statsOnly = false,
  showActions = false,
}: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const compact = compactProp ?? width < 600;
  const inactiveCount = inactiveProp ?? Math.max(0, totalCount - activeCount);

  const badges = (
    <>
      <HeroStatPill label="إجمالي" value={totalCount} compact />
      <HeroStatPill label="نشط" value={activeCount} tone="success" compact />
      <HeroStatPill label="غير نشط" value={inactiveCount} tone="warning" compact />
      {productsTotal > 0 ? <HeroStatPill label="أصناف" value={productsTotal} compact /> : null}
    </>
  );

  const actions = (
    <ScrollView
      horizontal={!isTablet}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ ...flexRow, gap: spacing.sm, flexWrap: isTablet ? 'wrap' : undefined }}
    >
      {canManage && onAdd ? (
        <HeroActionChip label="مخزن جديد" icon="add" variant="primary" onPress={onAdd} />
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
          metaText={`${totalCount} مخزن في القائمة`}
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
        metaText={`${totalCount} مخزن في القائمة`}
        onRefresh={onRefresh}
        isLoading={isLoading}
      />
    </View>
  );

  return (
    <PremiumHeroPanel
      eyebrow="المخزون"
      title="المخازن"
      subtitle={
        readOnlyHint ??
        'عرض وإدارة المخازن — الربط بالفرع يتم من إعدادات الفرع (المخزن الافتراضي).'
      }
      badges={badges}
      rail={rail}
      compact={compact}
      edgeInset={false}
    />
  );
}
