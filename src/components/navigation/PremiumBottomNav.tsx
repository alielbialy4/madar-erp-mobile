import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
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

type TabIconName = 'home' | 'point-of-sale' | 'inventory-2' | 'receipt-long' | 'grid-view';

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
  MoreTab: { label: 'المزيد', icon: 'grid-view' },
};

/** Visual order: POS in the physical center of the bar */
const TAB_DISPLAY_ORDER: (keyof MainTabParamList)[] = [
  'DashboardTab',
  'ProductsTab',
  'POSTab',
  'SalesTab',
  'MoreTab',
];

const INACTIVE_COLOR = '#94A3B8';
const ACTIVE_PILL_BG = '#EEF4FF';
const ACTIVE_ACCENT = '#2563EB';
const DOCK_RADIUS = 32;
const MIN_TOUCH = 44;
const ACTIVE_SCALE = 1.06;

function StandardTab({
  label,
  icon,
  focused,
  onPress,
  styles,
}: {
  label: string;
  icon: TabIconName;
  focused: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const focusScale = useRef(new Animated.Value(1)).current;
  const pillOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(focusScale, {
        toValue: focused ? ACTIVE_SCALE : 1,
        friction: 6,
        tension: focused ? 180 : 140,
        useNativeDriver: true,
      }),
      Animated.timing(pillOpacity, {
        toValue: focused ? 1 : 0,
        duration: focused ? 180 : 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, focusScale, pillOpacity]);

  const handlePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.9, friction: 5, tension: 240, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }).start();
  };

  const iconColor = focused ? ACTIVE_ACCENT : INACTIVE_COLOR;
  const labelStyle = focused ? styles.standardLabelActive : styles.standardLabelInactive;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.standardSlot}
    >
      <Animated.View style={[styles.standardPressWrap, { transform: [{ scale: pressScale }] }]}>
        <Animated.View style={[styles.standardInner, { transform: [{ scale: focusScale }] }]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.activePill, { opacity: pillOpacity }]}
          />
          <MaterialIcons name={icon} size={22} color={iconColor} style={styles.standardIcon} />
          <Text style={labelStyle} numberOfLines={1}>
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function PosCenterTab({
  label,
  focused,
  onPress,
  styles,
  c,
}: {
  label: string;
  focused: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  c: AppColors;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const orbScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(orbScale, {
      toValue: focused ? ACTIVE_SCALE : 1,
      friction: 6,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [focused, orbScale]);

  const handlePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.92, friction: 5, tension: 240, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.posSlot}
    >
      <Animated.View style={[styles.posColumn, { transform: [{ scale: pressScale }] }]}>
        <Animated.View
          style={[
            styles.posOrb,
            focused ? styles.posOrbActive : styles.posOrbIdle,
            { transform: [{ scale: orbScale }] },
          ]}
        >
          <MaterialIcons name="point-of-sale" size={26} color={c.primaryForeground} />
        </Animated.View>
        <Text style={[styles.posLabel, focused && styles.posLabelActive]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function PremiumBottomNav({ state, navigation }: BottomTabBarProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_INSET) + TAB_BAR_FLOAT_GAP;

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
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    if (meta.isPos) {
      return (
        <PosCenterTab
          key={route.key}
          label={meta.label}
          focused={focused}
          onPress={onPress}
          styles={styles}
          c={c}
        />
      );
    }

    return (
      <StandardTab
        key={route.key}
        label={meta.label}
        icon={meta.icon}
        focused={focused}
        onPress={onPress}
        styles={styles}
      />
    );
  };

  return (
    <View style={[styles.root, { paddingBottom: bottomOffset }]} pointerEvents="box-none">
      <View style={styles.dockShadowHost}>
        <View style={styles.dock}>{TAB_DISPLAY_ORDER.map((name) => renderTab(name))}</View>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  const dockShadow = Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 18,
    },
    android: { elevation: 10 },
    default: {
      boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)',
    } as object,
  });

  const posShadow = Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
    },
    android: { elevation: 14 },
    default: {
      boxShadow: '0 6px 16px rgba(15, 23, 42, 0.22)',
    } as object,
  });

  return StyleSheet.create({
    root: {
      width: '100%',
      paddingHorizontal: TAB_BAR_HORIZONTAL_MARGIN,
      paddingTop: spacing.sm,
      backgroundColor: 'transparent',
      overflow: 'visible',
    },
    dockShadowHost: {
      overflow: 'visible',
      borderRadius: DOCK_RADIUS,
      backgroundColor: 'transparent',
      ...dockShadow,
    },
    dock: {
      ...flexRow,
      height: TAB_BAR_DOCK_HEIGHT,
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: c.surface,
      borderRadius: DOCK_RADIUS,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      overflow: 'visible',
    },
    standardSlot: {
      flex: 1,
      minHeight: MIN_TOUCH,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 2,
    },
    standardPressWrap: {
      width: '100%',
      alignItems: 'center',
    },
    standardInner: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: MIN_TOUCH,
      minHeight: MIN_TOUCH,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 3,
    },
    activePill: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: ACTIVE_PILL_BG,
      borderRadius: 22,
    },
    standardIcon: {
      zIndex: 1,
    },
    standardLabelActive: {
      zIndex: 1,
      fontSize: 11,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: ACTIVE_ACCENT,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    standardLabelInactive: {
      zIndex: 1,
      fontSize: 11,
      fontFamily: fonts.medium,
      fontWeight: '500',
      color: INACTIVE_COLOR,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    posSlot: {
      flex: 1.05,
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: -22,
      minHeight: MIN_TOUCH,
    },
    posColumn: {
      alignItems: 'center',
      gap: 5,
    },
    posOrb: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: '#FFFFFF',
    },
    posOrbActive: {
      backgroundColor: c.primary,
      ...posShadow,
    },
    posOrbIdle: {
      backgroundColor: c.primary,
      opacity: 0.92,
      ...posShadow,
    },
    posLabel: {
      fontSize: 11,
      fontFamily: fonts.medium,
      fontWeight: '600',
      color: INACTIVE_COLOR,
      textAlign: 'center',
      writingDirection: 'rtl',
      maxWidth: 72,
    },
    posLabelActive: {
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: ACTIVE_ACCENT,
    },
  });
}
