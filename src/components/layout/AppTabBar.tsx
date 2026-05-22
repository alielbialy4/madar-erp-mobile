import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppColors } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { tabPulse } from '@/utils/animations';
import type { MainTabParamList } from '@/types/navigation';

type TabIconName = 'home' | 'point-of-sale' | 'inventory-2' | 'receipt-long' | 'apps';

const TAB_META: Record<keyof MainTabParamList, { label: string; icon: TabIconName }> = {
  DashboardTab: { label: 'الرئيسية', icon: 'home' },
  POSTab: { label: 'نقطة البيع', icon: 'point-of-sale' },
  ProductsTab: { label: 'المنتجات', icon: 'inventory-2' },
  SalesTab: { label: 'المبيعات', icon: 'receipt-long' },
  MoreTab: { label: 'المزيد', icon: 'apps' },
};

function TabButton({
  label,
  icon,
  focused,
  onPress,
  onLongPress,
  styles,
  c,
}: {
  label: string;
  icon: TabIconName;
  focused: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  styles: ReturnType<typeof createTabBarStyles>;
  c: AppColors;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) tabPulse(scale);
  }, [focused, scale]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabBtn}
    >
      <Animated.View style={[styles.tabInner, focused ? styles.tabInnerActive : undefined, { transform: [{ scale }] }]}>
        <MaterialIcons
          name={icon}
          size={focused ? 26 : 24}
          color={focused ? c.tabBarActive : c.tabBarInactive}
        />
        <Text style={[styles.tabLabel, focused ? styles.tabLabelActive : undefined]} numberOfLines={1}>
          {label}
        </Text>
        {focused ? <View style={styles.activeDot} /> : null}
      </Animated.View>
    </Pressable>
  );
}

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const c = useColors();
  const styles = useMemo(() => createTabBarStyles(c), [c]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TAB_META[route.name as keyof MainTabParamList];
        if (!meta) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabButton
            key={route.key}
            label={meta.label}
            icon={meta.icon}
            focused={focused}
            onPress={onPress}
            styles={styles}
            c={c}
          />
        );
      })}
    </View>
  );
}

function createTabBarStyles(c: AppColors) {
  return StyleSheet.create({
  bar: {
    ...flexRow,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.borderSubtle,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    minHeight: 64,
    shadowColor: c.shadowMd,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    paddingVertical: spacing.xs,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    minWidth: 56,
  },
  tabInnerActive: {
    backgroundColor: c.softPrimary,
  },
  tabLabel: {
    ...textStart,
    fontSize: typography.tiny,
    fontFamily: fonts.medium,
    color: c.tabBarInactive,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: c.tabBarActive,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.tabBarActive,
    marginTop: 2,
  },
});
}
