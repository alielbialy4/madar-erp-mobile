import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { hasPermission } from '@/utils/permissions';
import { flexRow } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { AppIcon } from '@/components/ui/AppIcon';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/types/navigation';
import { Text } from '@/components/ui/AppText';

type Props = {
  navigation: BottomTabNavigationProp<MainTabParamList>;
};

type IconName = Parameters<typeof AppIcon>[0]['name'];

type Action = {
  key: string;
  label: string;
  icon: IconName;
  primary?: boolean;
  onPress: () => void;
};

export function DashboardQuickActions({ navigation }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = Boolean(user?.is_super_admin);

  const actions: Action[] = [];
  if (isSuperAdmin || hasPermission(user, 'process_sales')) {
    actions.push({
      key: 'pos',
      label: 'نقطة البيع',
      icon: 'storefront',
      primary: true,
      onPress: () => navigation.navigate('POSTab'),
    });
  }
  if (isSuperAdmin || hasPermission(user, 'view_reports')) {
    actions.push({
      key: 'reports',
      label: 'التقارير',
      icon: 'chart-bar',
      onPress: () => navigation.navigate('MoreTab', { screen: 'Reports' }),
    });
  }
  if (isSuperAdmin || hasPermission(user, ['manage_users', 'manage_branches'])) {
    actions.push({
      key: 'settings',
      label: 'الإعدادات',
      icon: 'gear',
      onPress: () => navigation.navigate('MoreTab', { screen: 'Settings' }),
    });
  }

  if (actions.length === 0) return null;

  return (
    <View style={[styles.chipRow, flexRow]}>
      {actions.map((action) => {
        if (action.primary) {
          return (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.chip,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <LinearGradient
                colors={[c.accent, c.accent + 'DD']}
                style={styles.chipGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <AppIcon name={action.icon} size={18} color="#FFFFFF" weight="bold" />
                <Text style={styles.chipTextPrimary}>{action.label}</Text>
              </LinearGradient>
            </Pressable>
          );
        }
        return (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.chip,
              styles.chipOutline,
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    chipRow: {
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    chip: {
      borderRadius: radius.xl,
      overflow: 'hidden',
    },
    chipGradient: {
      ...flexRow,
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.xl,
      alignItems: 'center',
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    chipOutline: {
      ...flexRow,
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.xl,
      alignItems: 'center',
      backgroundColor: c.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
    },
    chipText: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: c.text,
    },
    chipTextPrimary: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: '#FFFFFF',
    },
  });
}
