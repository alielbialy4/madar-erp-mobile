import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuthStore } from '@/store/authStore';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { hasPermission } from '@/utils/permissions';
import { flexRow } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { HERO_ACTIONS_CONTAINER_BG, HERO_ACTIONS_CONTAINER_BORDER } from '@/constants/dashboardHeroTheme';
import { HeroActionChip } from '@/components/layout/HeroActionChip';
import { AppIcon } from '@/components/ui/AppIcon';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/types/navigation';
import { Text } from '@/components/ui/AppText';

type Props = {
  navigation: BottomTabNavigationProp<MainTabParamList>;
  variant?: 'default' | 'hero';
};

type IconName = Parameters<typeof AppIcon>[0]['name'];

type HeroIconName = keyof typeof MaterialIcons.glyphMap;

type Action = {
  key: string;
  label: string;
  icon: IconName;
  heroIcon: HeroIconName;
  primary?: boolean;
  onPress: () => void;
};

export function DashboardQuickActions({ navigation, variant = 'default' }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const isHero = variant === 'hero';
  const styles = useMemo(() => createStyles(c, isHero, isTablet), [c, isHero, isTablet]);
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = Boolean(user?.is_super_admin);

  const actions: Action[] = [];
  if (isSuperAdmin || hasPermission(user, 'process_sales')) {
    actions.push({
      key: 'pos',
      label: 'نقطة البيع',
      icon: 'storefront',
      heroIcon: 'store',
      primary: true,
      onPress: () => navigation.navigate('POSTab'),
    });
  }
  if (isSuperAdmin || hasPermission(user, 'view_reports')) {
    actions.push({
      key: 'reports',
      label: 'التقارير',
      icon: 'chart-bar',
      heroIcon: 'bar-chart',
      onPress: () => navigation.navigate('MoreTab', { screen: 'Reports' }),
    });
  }
  if (isSuperAdmin || hasPermission(user, ['manage_users', 'manage_branches'])) {
    actions.push({
      key: 'settings',
      label: 'الإعدادات',
      icon: 'gear',
      heroIcon: 'settings',
      onPress: () => navigation.navigate('MoreTab', { screen: 'Settings' }),
    });
  }

  if (actions.length === 0) return null;

  if (isHero) {
    const chips = (
      <>
        {actions.map((action) => (
          <HeroActionChip
            key={action.key}
            label={action.label}
            icon={action.heroIcon}
            variant={action.primary ? 'primary' : 'secondary'}
            onPress={action.onPress}
          />
        ))}
      </>
    );

    return (
      <View style={styles.chipRow}>
        {!isTablet ? <View style={styles.heroContainer}>{chips}</View> : chips}
      </View>
    );
  }

  return (
    <View style={styles.chipRow}>
      {actions.map((action) => {
        if (action.primary) {
          return (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              style={({ pressed }) => [styles.chip, styles.chipPrimaryDefault, pressed && { transform: [{ scale: 0.96 }] }]}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <AppIcon name={action.icon} size={18} color={c.primaryForeground} weight="bold" />
              <Text style={styles.chipTextPrimaryDefault}>{action.label}</Text>
            </Pressable>
          );
        }
        return (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            style={({ pressed }) => [styles.chip, styles.chipOutlineDefault, pressed && { transform: [{ scale: 0.96 }] }]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <AppIcon name={action.icon} size={18} color={c.text} />
            <Text style={styles.chipText}>{action.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(c: AppColors, isHero: boolean, isTablet: boolean) {
  return StyleSheet.create({
    chipRow: {
      ...flexRow,
      gap: spacing.sm,
      flexWrap: 'wrap',
      ...(isHero && isTablet ? { justifyContent: 'flex-end' } : {}),
    },
    heroContainer: {
      ...flexRow,
      gap: spacing.sm,
      flexWrap: 'wrap',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: HERO_ACTIONS_CONTAINER_BORDER,
      backgroundColor: HERO_ACTIONS_CONTAINER_BG,
      borderRadius: radius.md,
      padding: spacing.sm,
      width: '100%',
    },
    chip: {
      ...flexRow,
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    chipPrimaryDefault: {
      backgroundColor: c.accent,
    },
    chipOutlineDefault: {
      backgroundColor: c.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
    },
    chipText: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: c.text,
    },
    chipTextPrimaryDefault: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: c.primaryForeground,
    },
  });
}
