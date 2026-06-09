import React from 'react';
import { View } from 'react-native';
import { PremiumHeroPanel } from '@/components/layout/PremiumHeroPanel';
import { HeroRefreshFooter } from '@/components/layout/HeroRefreshFooter';
import { spacing } from '@/constants/spacing';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  scopeBadges?: React.ReactNode;
  lastUpdatedLabel: string;
  isLoading?: boolean;
  onRefresh: () => void;
  quickActions?: React.ReactNode;
};

export function DashboardHero({
  eyebrow,
  title,
  subtitle,
  scopeBadges,
  lastUpdatedLabel,
  isLoading,
  onRefresh,
  quickActions,
}: Props) {
  const rail = (
    <View style={{ width: '100%', gap: spacing.sm }}>
      {quickActions ? <View style={{ width: '100%' }}>{quickActions}</View> : null}
      <HeroRefreshFooter
        metaText={`آخر تحديث ${lastUpdatedLabel}`}
        onRefresh={onRefresh}
        isLoading={isLoading}
      />
    </View>
  );

  return (
    <PremiumHeroPanel
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      badges={scopeBadges}
      rail={rail}
      edgeInset={false}
    />
  );
}
