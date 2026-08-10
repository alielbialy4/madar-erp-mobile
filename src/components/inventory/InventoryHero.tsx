import React from 'react';
import { ScrollView, View , useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PremiumHeroPanel } from '@/components/layout/PremiumHeroPanel';
import { HeroActionChip } from '@/components/layout/HeroActionChip';
import { HeroStatPill } from '@/components/layout/HeroStatPill';
import { HeroRefreshFooter } from '@/components/layout/HeroRefreshFooter';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';

type Stat = { label: string; value: string | number; tone?: 'default' | 'success' | 'warning' | 'danger' };

type Chip = {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
  primary?: boolean;
};

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  stats?: Stat[];
  chips?: Chip[];
  metaLabel?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  compact?: boolean;
  statsOnly?: boolean;
  showActions?: boolean;
};

function statTone(tone?: Stat['tone']): 'default' | 'success' | 'warning' | 'danger' {
  if (tone === 'success' || tone === 'warning' || tone === 'danger') return tone;
  return 'default';
}

export function InventoryHero({
  eyebrow,
  title,
  subtitle,
  stats = [],
  chips = [],
  metaLabel,
  isLoading,
  onRefresh,
  compact: compactProp,
  statsOnly = false,
  showActions = false,
}: Props) {
  const { width } = useWindowDimensions();
  const compact = compactProp ?? width < 600;

  const badges = (
    <>
      {stats.map((s) => (
        <HeroStatPill key={s.label} label={s.label} value={s.value} tone={statTone(s.tone)} compact />
      ))}
    </>
  );

  const actions =
    chips.length > 0 ? (
      <View style={{ ...flexRow, gap: spacing.sm, flexWrap: 'wrap', width: '100%' }}>
        {chips.map((chip) => (
          <HeroActionChip
            key={chip.label}
            label={chip.label}
            icon={chip.icon}
            onPress={chip.onPress}
            variant={chip.primary ? 'primary' : 'secondary'}
            fill
          />
        ))}
      </View>
    ) : null;

  if (statsOnly) {
    return (
      <View style={{ gap: spacing.sm }}>
        {stats.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {badges}
          </ScrollView>
        ) : null}
        {showActions ? actions : null}
        {onRefresh ? (
          <HeroRefreshFooter
            metaText={metaLabel ?? `${stats[0]?.value ?? 0} عنصر`}
            onRefresh={onRefresh}
            isLoading={isLoading}
          />
        ) : null}
      </View>
    );
  }

  const rail = (
    <View style={{ width: '100%', gap: spacing.sm }}>
      {actions ? <View style={{ width: '100%' }}>{actions}</View> : null}
      {onRefresh ? (
        <HeroRefreshFooter
          metaText={metaLabel ?? `${stats[0]?.value ?? 0} عنصر`}
          onRefresh={onRefresh}
          isLoading={isLoading}
        />
      ) : null}
    </View>
  );

  return (
    <PremiumHeroPanel
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      badges={stats.length > 0 ? badges : undefined}
      rail={onRefresh || actions ? rail : undefined}
      compact={compact}
      edgeInset={false}
    />
  );
}
