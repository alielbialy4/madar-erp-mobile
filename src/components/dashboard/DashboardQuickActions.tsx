import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuthStore } from '@/store/authStore';
import { useColors } from '@/hooks/useColors';
import { hasPermission } from '@/utils/permissions';
import { flexRow } from '@/constants/layout';
import { createDashboardStyles } from './dashboardStyles';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/types/navigation';
import { Text } from '@/components/ui/AppText';

type Props = {
  navigation: BottomTabNavigationProp<MainTabParamList>;
};

type Action = {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  primary?: boolean;
  onPress: () => void;
};

export function DashboardQuickActions({ navigation }: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = Boolean(user?.is_super_admin);

  const actions: Action[] = [];
  if (isSuperAdmin || hasPermission(user, 'process_sales')) {
    actions.push({
      key: 'pos',
      label: 'نقطة البيع',
      icon: 'point-of-sale',
      primary: true,
      onPress: () => navigation.navigate('POSTab'),
    });
  }
  if (isSuperAdmin || hasPermission(user, 'view_reports')) {
    actions.push({
      key: 'reports',
      label: 'التقارير',
      icon: 'bar-chart',
      onPress: () => navigation.navigate('MoreTab', { screen: 'Reports' }),
    });
  }
  if (isSuperAdmin || hasPermission(user, ['manage_users', 'manage_branches'])) {
    actions.push({
      key: 'settings',
      label: 'الإعدادات',
      icon: 'settings',
      onPress: () => navigation.navigate('MoreTab', { screen: 'Settings' }),
    });
  }

  if (actions.length === 0) return null;

  return (
    <View style={[ds.chipRow, flexRow]}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          onPress={action.onPress}
          style={({ pressed }) => [
            ds.actionChip,
            action.primary ? ds.actionChipPrimary : ds.actionChipOutline,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <MaterialIcons
            name={action.icon}
            size={18}
            color={action.primary ? c.primaryForeground : c.textMuted}
          />
          <Text
            style={[
              ds.actionChipText,
              { color: action.primary ? c.primaryForeground : c.text },
            ]}
          >
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
