import React from 'react';
import { ModuleHeader } from './ModuleHeader';

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
  return (
    <ModuleHeader
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      stats={stats}
      actions={actions}
      onRefresh={onRefresh}
      refreshing={refreshing}
      compact={compact}
    />
  );
}
