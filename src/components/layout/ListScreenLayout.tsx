import React from 'react';
import { View, ViewStyle } from 'react-native';
import { AppScreen } from './AppScreen';
import { ModuleHero, type ModuleHeroStat } from './ModuleHero';
import { AppSearchField } from '@/components/ui/AppSearchField';
import { AppFAB } from '@/components/ui/AppFAB';
import { spacing } from '@/constants/spacing';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  hero?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    stats?: ModuleHeroStat[];
    actions?: React.ReactNode;
    compact?: boolean;
  };
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  headerRight?: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  fab?: { onPress: () => void; icon?: React.ComponentProps<typeof AppFAB>['icon']; label?: string };
  contentStyle?: ViewStyle;
  noHeader?: boolean;
  onBack?: () => void;
};

export function ListScreenLayout({
  title,
  subtitle,
  children,
  hero,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  headerRight,
  onRefresh,
  refreshing,
  fab,
  contentStyle,
  noHeader,
  onBack,
}: Props) {
  return (
    <AppScreen
      title={title}
      subtitle={subtitle}
      scroll={false}
      headerRight={headerRight}
      noHeader={noHeader}
      onBack={onBack}
      onRefresh={onRefresh}
      refreshing={refreshing}
      contentStyle={{ padding: 0, gap: spacing.md, ...(contentStyle ?? {}) }}
    >
      <View style={{ flex: 1, gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
        {hero ? (
          <ModuleHero
            eyebrow={hero.eyebrow}
            title={hero.title ?? title}
            subtitle={hero.subtitle ?? subtitle}
            stats={hero.stats}
            actions={hero.actions}
            compact={hero.compact}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        ) : null}
        {onSearchChange != null && searchValue != null ? (
          <AppSearchField value={searchValue} onChangeText={onSearchChange} placeholder={searchPlaceholder ?? 'بحث...'} />
        ) : null}
        {filters ? <View style={{ gap: spacing.sm }}>{filters}</View> : null}
        <View style={{ flex: 1 }}>{children}</View>
      </View>
      {fab ? <AppFAB onPress={fab.onPress} icon={fab.icon} accessibilityLabel={fab.label ?? 'إضافة'} /> : null}
    </AppScreen>
  );
}
