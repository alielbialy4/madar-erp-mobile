import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { flexRow, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useNetworkStore } from '@/store/networkStore';

type MobileTab = 'catalog' | 'cart';

type Props = {
  mobileTab: MobileTab;
  onMobileTabChange: (tab: MobileTab) => void;
  cartCount: number;
  shiftLabel: string;
  cashierName?: string;
  lastSyncedLabel?: string | null;
  showMobileTabs?: boolean;
  onExit?: () => void;
  /** Brief pulse when cart count increases (add-to-cart feedback). */
  cartPulse?: boolean;
};

export function PosTopBar({
  mobileTab,
  onMobileTabChange,
  cartCount,
  shiftLabel,
  cashierName,
  lastSyncedLabel,
  showMobileTabs = true,
  onExit,
  cartPulse,
}: Props) {
  const isOnline = useNetworkStore((s) => s.isOnline);
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const cartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!cartPulse) return;
    Animated.sequence([
      Animated.spring(cartScale, { toValue: 1.12, friction: 4, tension: 200, useNativeDriver: true }),
      Animated.spring(cartScale, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }),
    ]).start();
  }, [cartPulse, cartScale]);

  return (
    <View style={styles.bar}>
      <View style={styles.topRow}>
        {onExit ? (
          <Pressable onPress={onExit} style={styles.exitBtn}>
            <MaterialIcons name="arrow-forward" size={20} color={c.text} />
          </Pressable>
        ) : null}
        <View style={[styles.statusChip, isOnline ? styles.chipOnline : styles.chipOffline]}>
          <View style={[styles.dot, { backgroundColor: isOnline ? c.success : c.danger }]} />
          <Text style={styles.chipText}>{isOnline ? 'متصل' : 'غير متصل'}</Text>
        </View>
        <View style={styles.infoGroup}>
          <Text style={styles.shiftLabel} numberOfLines={1}>{shiftLabel}</Text>
          {cashierName ? <Text style={styles.cashier} numberOfLines={1}>{cashierName}</Text> : null}
        </View>
        {lastSyncedLabel ? (
          <Text style={styles.synced} numberOfLines={1}>{lastSyncedLabel}</Text>
        ) : null}
      </View>
      {showMobileTabs ? (
        <View style={styles.tabs}>
          <Pressable
            onPress={() => onMobileTabChange('catalog')}
            style={[styles.tab, mobileTab === 'catalog' ? styles.tabActive : undefined]}
          >
            <MaterialIcons name="grid-view" size={18} color={mobileTab === 'catalog' ? c.accent : c.textCaption} />
            <Text style={[styles.tabLabel, mobileTab === 'catalog' ? styles.tabLabelActive : undefined]}>الكتالوج</Text>
          </Pressable>
          <Pressable
            onPress={() => onMobileTabChange('cart')}
            style={[styles.tab, mobileTab === 'cart' ? styles.tabActive : undefined]}
          >
            <Animated.View style={{ transform: [{ scale: cartScale }], ...flexRow, alignItems: 'center', gap: 4 }}>
              <MaterialIcons name="shopping-cart" size={18} color={mobileTab === 'cart' ? c.accent : c.textCaption} />
              <Text style={[styles.tabLabel, mobileTab === 'cart' ? styles.tabLabelActive : undefined]}>
                السلة{cartCount > 0 ? ` (${cartCount})` : ''}
              </Text>
            </Animated.View>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    bar: {
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    topRow: { ...flexRow, alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
    exitBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusChip: {
      ...flexRow,
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    chipOnline: { backgroundColor: c.softSuccess, borderColor: c.softSuccessBorder },
    chipOffline: { backgroundColor: c.softDanger, borderColor: c.softDangerBorder },
    dot: { width: 7, height: 7, borderRadius: 4 },
    chipText: { fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700', color: c.text },
    infoGroup: { flex: 1, gap: 0 },
    shiftLabel: { ...textStart, fontSize: typography.small, fontFamily: fonts.bold, color: c.text },
    cashier: { ...textStart, fontSize: typography.tiny, color: c.textMuted, fontFamily: fonts.medium },
    synced: { ...textStart, fontSize: 10, color: c.textCaption, fontFamily: fonts.regular },
    tabs: { ...flexRow, gap: spacing.sm },
    tab: {
      flex: 1,
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      minHeight: 38,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
    },
    tabActive: { backgroundColor: c.accentSoft },
    tabLabel: { fontSize: typography.small, fontFamily: fonts.medium, color: c.textCaption, fontWeight: '600' },
    tabLabelActive: { color: c.accent, fontFamily: fonts.bold, fontWeight: '700' },
  });
}
