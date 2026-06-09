import React from 'react';
import { View } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { PremiumHeroPanel } from './PremiumHeroPanel';
import { HeroStatPill } from './HeroStatPill';
import { HeroRefreshFooter } from './HeroRefreshFooter';
import { spacing } from '@/constants/spacing';

export type ModuleHeroStat = {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  stats?: ModuleHeroStat[];
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: React.ReactNode;
  compact?: boolean;
};

export function ModuleHero({ eyebrow, title, subtitle, stats, onRefresh, refreshing, actions, compact }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;

  const badges =
    stats && stats.length > 0 ? (
      <>
        {stats.map((stat) => (
          <HeroStatPill key={stat.label} label={stat.label} value={stat.value} tone={stat.tone} compact={compact} />
        ))}
      </>
    ) : undefined;

  const hasRail = Boolean(actions || onRefresh);
  const rail = hasRail ? (
    <View style={{ width: '100%', gap: spacing.sm }}>
      {actions ? (
        <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {actions}
        </View>
      ) : null}
      {onRefresh ? <HeroRefreshFooter onRefresh={onRefresh} isLoading={refreshing} /> : null}
    </View>
  ) : undefined;

  return (
    <PremiumHeroPanel
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      badges={badges}
      rail={rail}
      compact={compact}
      edgeInset={false}
    />
  );
}
