import React from 'react';
import { View, ViewStyle, StyleSheet, useWindowDimensions } from 'react-native';
import { AppScreen } from './AppScreen';
import { ModuleHero, type ModuleHeroStat } from './ModuleHero';
import { AppSearchField } from '@/components/ui/AppSearchField';
import { AppFAB } from '@/components/ui/AppFAB';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { getProductLayoutTier, isProductTablet } from '@/constants/productLayout';

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
  commandsInlineOnPhone?: boolean;
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
  commandsInlineOnPhone = false,
  headerRight,
  onRefresh,
  refreshing,
  fab,
  contentStyle,
  noHeader,
  onBack,
}: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const tablet = isProductTablet(getProductLayoutTier(width));
  const inlineCommands = tablet || commandsInlineOnPhone;
  const hasCommands = (onSearchChange != null && searchValue != null) || Boolean(filters);

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
      <View style={styles.root}>
        {hero ? (
          <View style={styles.horizontalInset}>
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
          </View>
        ) : null}
        {hasCommands ? (
          <View
            style={[
              styles.commandBar,
              inlineCommands && styles.commandBarTablet,
              { backgroundColor: c.surface, borderColor: c.borderSubtle },
            ]}
          >
            {onSearchChange != null && searchValue != null ? (
              <View style={[styles.searchSlot, inlineCommands && styles.searchSlotTablet]}>
                <AppSearchField compact value={searchValue} onChangeText={onSearchChange} placeholder={searchPlaceholder ?? 'بحث...'} />
              </View>
            ) : null}
            {filters ? <View style={[styles.filtersSlot, inlineCommands && styles.filtersSlotTablet]}>{filters}</View> : null}
          </View>
        ) : null}
        <View style={styles.content}>{children}</View>
      </View>
      {fab ? <AppFAB onPress={fab.onPress} icon={fab.icon} accessibilityLabel={fab.label ?? 'إضافة'} /> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.sm, paddingTop: spacing.xs },
  horizontalInset: { paddingHorizontal: spacing.lg },
  commandBar: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 1,
  },
  commandBarTablet: { flexDirection: 'row', alignItems: 'flex-start' },
  searchSlot: { width: '100%', minWidth: 0, flexGrow: 0, flexShrink: 0 },
  searchSlotTablet: { width: 'auto', flex: 1, minWidth: 220 },
  filtersSlot: { width: '100%', gap: spacing.sm, flexGrow: 0, flexShrink: 0 },
  filtersSlotTablet: { width: 'auto', flexShrink: 1 },
  content: { flex: 1, minHeight: 0 },
});
