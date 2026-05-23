import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { flexRow, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { backArrowIcon } from '@/utils/rtl';
import { PosBranchMark, PosOnlineChip, PosShiftChip, usePosHeaderBarStyle } from '@/components/pos/posHeaderUi';

type MobileTab = 'catalog' | 'cart';

type Props = {
  mobileTab: MobileTab;
  onMobileTabChange: (tab: MobileTab) => void;
  cartCount: number;
  shiftLabel: string;
  hasShift?: boolean;
  branchName?: string | null;
  cashierName?: string;
  lastSyncedLabel?: string | null;
  showMobileTabs?: boolean;
  onExit?: () => void;
  cartPulse?: boolean;
};

export function PosTopBar({
  mobileTab,
  onMobileTabChange,
  cartCount,
  shiftLabel,
  hasShift = false,
  branchName,
  cashierName,
  lastSyncedLabel,
  showMobileTabs = true,
  onExit,
  cartPulse,
}: Props) {
  const c = useColors();
  const bar = usePosHeaderBarStyle();
  const styles = useMemo(() => createStyles(c), [c]);
  const cartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!cartPulse) return;
    Animated.sequence([
      Animated.spring(cartScale, { toValue: 1.12, friction: 4, tension: 200, useNativeDriver: true }),
      Animated.spring(cartScale, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }),
    ]).start();
  }, [cartPulse, cartScale]);

  const metaParts = [cashierName, lastSyncedLabel ? `مزامنة ${lastSyncedLabel}` : null].filter(Boolean);

  return (
    <View style={bar.bar}>
      <View style={styles.mainRow}>
        {onExit ? (
          <Pressable onPress={onExit} style={styles.exitBtn} accessibilityRole="button" accessibilityLabel="خروج">
            <MaterialIcons name={backArrowIcon()} size={20} color={c.text} />
          </Pressable>
        ) : null}

        <PosBranchMark size="sm" />

        <View style={styles.identity}>
          <Text style={bar.title}>نقطة البيع</Text>
          <Text style={bar.branchName} numberOfLines={1}>
            {branchName?.trim() || 'بدون فرع'}
          </Text>
        </View>

        <View style={styles.chips}>
          <PosShiftChip active={hasShift} label={shiftLabel} />
          <PosOnlineChip compact />
        </View>
      </View>

      {metaParts.length > 0 ? (
        <Text style={bar.meta} numberOfLines={1}>
          {metaParts.join(' · ')}
        </Text>
      ) : null}

      {showMobileTabs ? (
        <View style={styles.segment}>
          <Pressable
            onPress={() => onMobileTabChange('catalog')}
            style={[styles.segmentItem, mobileTab === 'catalog' && styles.segmentItemActive]}
          >
            <MaterialIcons name="grid-view" size={18} color={mobileTab === 'catalog' ? c.primary : c.textMuted} />
            <Text style={[styles.segmentLabel, mobileTab === 'catalog' && styles.segmentLabelActive]}>الكتالوج</Text>
          </Pressable>

          <Pressable
            onPress={() => onMobileTabChange('cart')}
            style={[styles.segmentItem, mobileTab === 'cart' && styles.segmentItemActive]}
          >
            <Animated.View style={[styles.cartTabInner, { transform: [{ scale: cartScale }] }]}>
              <MaterialIcons name="shopping-cart" size={18} color={mobileTab === 'cart' ? c.primary : c.textMuted} />
              <Text style={[styles.segmentLabel, mobileTab === 'cart' && styles.segmentLabelActive]}>السلة</Text>
              {cartCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              ) : null}
            </Animated.View>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c: AppColors) {
  const segmentShadow = Platform.select({
    ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
    android: { elevation: 2 },
    default: {},
  });

  return StyleSheet.create({
    mainRow: { ...flexRow, alignItems: 'center', gap: spacing.sm },
    exitBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    identity: { flex: 1, minWidth: 0, gap: 1 },
    chips: { ...flexRow, alignItems: 'center', gap: spacing.xs, flexShrink: 0 },
    segment: {
      ...flexRow,
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: 3,
      gap: 3,
    },
    segmentItem: {
      flex: 1,
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      minHeight: 40,
      borderRadius: radius.lg,
    },
    segmentItemActive: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...segmentShadow,
    },
    segmentLabel: {
      fontSize: typography.small,
      fontFamily: fonts.medium,
      fontWeight: '600',
      color: c.textMuted,
    },
    segmentLabelActive: {
      color: c.primary,
      fontFamily: fonts.bold,
      fontWeight: '700',
    },
    cartTabInner: { ...flexRow, alignItems: 'center', gap: spacing.xs, position: 'relative' },
    cartBadge: {
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: radius.pill,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginStart: -2,
    },
    cartBadgeText: {
      fontSize: 10,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.primaryForeground,
      writingDirection: 'ltr',
    },
  });
}
