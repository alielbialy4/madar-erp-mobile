import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { TAB_BAR_DOCK_HEIGHT, TAB_BAR_MIN_BOTTOM_INSET } from '@/constants/tabBar';
import type { MainTabParamList } from '@/types/navigation';

type TabIconName = 'home' | 'point-of-sale' | 'inventory-2' | 'receipt-long' | 'apps';
type TabMeta = { label: string; icon: TabIconName };

const TAB_META: Record<keyof MainTabParamList, TabMeta> = {
  DashboardTab: { label: 'الرئيسية', icon: 'home' },
  POSTab: { label: 'نقطة البيع', icon: 'point-of-sale' },
  ProductsTab: { label: 'المنتجات', icon: 'inventory-2' },
  SalesTab: { label: 'المبيعات', icon: 'receipt-long' },
  MoreTab: { label: 'العمليات', icon: 'apps' },
};

const TAB_DISPLAY_ORDER: (keyof MainTabParamList)[] = [
  'DashboardTab',
  'POSTab',
  'SalesTab',
  'ProductsTab',
  'MoreTab',
];

const TAB_ROOT_SCREENS: Partial<Record<keyof MainTabParamList, string>> = {
  POSTab: 'POSHome',
  ProductsTab: 'ProductsHome',
  SalesTab: 'SalesHome',
  MoreTab: 'MoreHome',
};

export function PremiumBottomNav({ state, navigation }: BottomTabBarProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const routeByName = new Map<string, (typeof state.routes)[number]>();
  state.routes.forEach((route) => routeByName.set(route.name, route));

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          paddingBottom: Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_INSET),
        },
      ]}
    >
      <View style={styles.tabs}>
        {TAB_DISPLAY_ORDER.map((routeName) => {
          const route = routeByName.get(routeName);
          if (!route) return null;
          const meta = TAB_META[routeName];
          const routeIndex = state.routes.findIndex((item) => item.key === route.key);
          const focused = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (event.defaultPrevented) return;
            if (focused) {
              const rootScreen = TAB_ROOT_SCREENS[routeName];
              if (rootScreen) navigation.navigate(route.name, { screen: rootScreen });
              return;
            }
            navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={meta.label}
              accessibilityState={{ selected: focused }}
              style={({ pressed }) => [styles.tab, pressed && { backgroundColor: c.surfaceMuted }]}
            >
              <View style={[styles.selectionMark, { backgroundColor: focused ? c.primary : 'transparent' }]} />
              <View style={[styles.iconSlot, focused && { backgroundColor: c.softPrimary }]}>
                <AppIcon
                  name={meta.icon}
                  size={22}
                  color={focused ? c.primary : c.textCaption}
                  weight={focused ? 'fill' : 'regular'}
                />
              </View>
              <AppText style={[styles.label, { color: focused ? c.text : c.textCaption }]} numberOfLines={1}>
                {meta.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabs: {
    ...flexRow,
    height: TAB_BAR_DOCK_HEIGHT,
    alignItems: 'stretch',
    paddingHorizontal: spacing.xs,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radius.sm,
    position: 'relative',
  },
  selectionMark: {
    position: 'absolute',
    top: 0,
    width: 26,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  iconSlot: {
    width: 34,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 10,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
