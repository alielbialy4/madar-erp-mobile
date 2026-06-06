import React, { useEffect, useMemo, useRef } from 'react';
import { Text } from '@/components/ui/AppText';
import {
  Animated,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppColors } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import {
  TAB_BAR_DOCK_HEIGHT,
  TAB_BAR_FLOAT_GAP,
  TAB_BAR_HORIZONTAL_MARGIN,
  TAB_BAR_MIN_BOTTOM_INSET,
} from '@/constants/tabBar';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import type { MainTabParamList } from '@/types/navigation';
import { popTabStackToRoot } from '@/navigation/nestedTabNavigation';

type TabIconName = 'home' | 'point-of-sale' | 'inventory-2' | 'receipt-long' | 'apps';

type TabMeta = {
  label: string;
  icon: TabIconName;
  isPos?: boolean;
};

const TAB_META: Record<keyof MainTabParamList, TabMeta> = {
  DashboardTab: { label: 'الرئيسية', icon: 'home' },
  POSTab: { label: 'نقطة البيع', icon: 'point-of-sale', isPos: true },
  ProductsTab: { label: 'المنتجات', icon: 'inventory-2' },
  SalesTab: { label: 'المبيعات', icon: 'receipt-long' },
  MoreTab: { label: 'المزيد', icon: 'apps' },
};

const TAB_DISPLAY_ORDER: (keyof MainTabParamList)[] = [
  'DashboardTab',
  'ProductsTab',
  'POSTab',
  'SalesTab',
  'MoreTab',
];

const DOCK_RADIUS = 30;
const MIN_TOUCH = 48;
const POS_ORB_SIZE = 56;
const ICON_SLOT = 40;

function StandardTab({
  label,
  icon,
  focused,
  onPress,
  c,
}: {
  label: string;
  icon: TabIconName;
  focused: boolean;
  onPress: () => void;
  c: AppColors;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const glowScale = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const labelOpacity = useRef(new Animated.Value(focused ? 1 : 0.72)).current;
  const inactive = c.textCaption;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(glowScale, {
        toValue: focused ? 1 : 0,
        friction: 7,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.timing(labelOpacity, {
        toValue: focused ? 1 : 0.72,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, glowScale, labelOpacity]);

  const handlePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.9, friction: 5, tension: 280, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
  };

  const iconColor = focused ? c.tabBarActive : inactive;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', minHeight: MIN_TOUCH, paddingBottom: 2 }}
    >
      <Animated.View style={{ transform: [{ scale: pressScale }], alignItems: 'center', gap: 4 }}>
        <View style={{ width: ICON_SLOT, height: ICON_SLOT, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              position: 'absolute',
              width: ICON_SLOT,
              height: ICON_SLOT,
              borderRadius: ICON_SLOT / 2,
              backgroundColor: c.softPrimary,
              transform: [{ scale: glowScale }],
              opacity: glowScale,
            }}
          />
          <MaterialIcons name={icon} size={focused ? 24 : 22} color={iconColor} />
        </View>
        <Animated.Text
          style={{
            fontSize: 10,
            fontFamily: focused ? fonts.bold : fonts.medium,
            fontWeight: focused ? '700' : '500',
            color: focused ? c.tabBarActive : inactive,
            textAlign: 'center',
            writingDirection: 'rtl',
            opacity: labelOpacity,
          }}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function PosCenterTab({
  label,
  focused,
  onPress,
  c,
}: {
  label: string;
  focused: boolean;
  onPress: () => void;
  c: AppColors;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const orbScale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(focused ? 1.08 : 1)).current;
  const inactive = c.textCaption;

  useEffect(() => {
    Animated.spring(ringScale, {
      toValue: focused ? 1.08 : 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [focused, ringScale]);

  const handlePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.92, friction: 4, tension: 260, useNativeDriver: true }).start();
    Animated.spring(orbScale, { toValue: 0.96, friction: 4, tension: 260, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }).start();
    Animated.spring(orbScale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1.15, alignItems: 'center', justifyContent: 'flex-end', marginTop: -22 }}
    >
      <Animated.View style={{ alignItems: 'center', gap: 6, transform: [{ scale: pressScale }] }}>
        <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              position: 'absolute',
              width: POS_ORB_SIZE + 14,
              height: POS_ORB_SIZE + 14,
              borderRadius: (POS_ORB_SIZE + 14) / 2,
              borderWidth: 2,
              borderColor: c.accentBorder,
              opacity: focused ? 0.9 : 0.35,
              transform: [{ scale: ringScale }],
            }}
          />
          <Animated.View
            style={{
              width: POS_ORB_SIZE,
              height: POS_ORB_SIZE,
              borderRadius: POS_ORB_SIZE / 2,
              backgroundColor: c.primary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: c.surface,
              transform: [{ scale: orbScale }],
              ...Platform.select({
                ios: {
                  shadowColor: c.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                },
                android: { elevation: 10 },
                default: { boxShadow: `0 6px 20px ${c.cardGlow}` } as object,
              }),
            }}
          >
            <MaterialIcons name="point-of-sale" size={26} color={c.primaryForeground} />
          </Animated.View>
        </View>
        <Text
          style={{
            fontSize: 10,
            fontFamily: focused ? fonts.bold : fonts.medium,
            fontWeight: focused ? '700' : '500',
            color: focused ? c.primary : inactive,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function PremiumBottomNav({ state, navigation }: BottomTabBarProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_INSET) + TAB_BAR_FLOAT_GAP;

  const dockShadow = Platform.select({
    ios: { shadowColor: c.shadowMd, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 24 },
    android: { elevation: 12 },
    default: { boxShadow: `0 10px 32px ${c.shadowMd}` } as object,
  });

  const routeByName = useMemo(() => {
    const map = new Map<string, (typeof state.routes)[number]>();
    state.routes.forEach((r) => map.set(r.name, r));
    return map;
  }, [state]);

  const renderTab = (routeName: keyof MainTabParamList) => {
    const route = routeByName.get(routeName);
    const meta = TAB_META[routeName];
    if (!route || !meta) return null;

    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === routeIndex;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (event.defaultPrevented) return;
      if (focused) {
        if (routeName === 'MoreTab') {
          popTabStackToRoot(navigation, 'MoreTab', 'MoreHome');
        }
        return;
      }
      navigation.navigate(route.name);
    };

    if (meta.isPos) {
      return (
        <PosCenterTab key={route.key} label={meta.label} focused={focused} onPress={onPress} c={c} />
      );
    }

    return (
      <StandardTab
        key={route.key}
        label={meta.label}
        icon={meta.icon}
        focused={focused}
        onPress={onPress}
        c={c}
      />
    );
  };

  return (
    <View
      style={{
        width: '100%',
        paddingHorizontal: TAB_BAR_HORIZONTAL_MARGIN,
        paddingTop: spacing.sm,
        paddingBottom: bottomOffset,
        backgroundColor: 'transparent',
      }}
      pointerEvents="box-none"
    >
      <View style={{ overflow: 'visible', borderRadius: DOCK_RADIUS, backgroundColor: 'transparent', ...dockShadow }}>
        <View
          style={{
            ...flexRow,
            height: TAB_BAR_DOCK_HEIGHT,
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.xs,
            paddingBottom: 6,
            paddingTop: 4,
            backgroundColor: c.surface,
            borderRadius: DOCK_RADIUS,
            borderWidth: 1,
            borderColor: c.borderSubtle,
            overflow: 'visible',
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 12,
              right: 12,
              height: 1,
              backgroundColor: c.borderSubtle,
              opacity: 0.6,
            }}
          />
          {TAB_DISPLAY_ORDER.map((name) => renderTab(name))}
        </View>
      </View>
    </View>
  );
}
