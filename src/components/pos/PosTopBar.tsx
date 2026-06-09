import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { flexRow, rtlDirection, textStart } from '@/constants/layout';
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
  onShiftSummary?: () => void;
  onCloseShift?: () => void;
  onOpenDrawer?: () => void;
  openDrawerBusy?: boolean;
  onCashMovement?: () => void;
  onOpenTables?: () => void;
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
  onShiftSummary,
  onCloseShift,
  onOpenDrawer,
  openDrawerBusy = false,
  onCashMovement,
  onOpenTables,
}: Props) {
  const c = useColors();
  const bar = usePosHeaderBarStyle();
  const styles = useMemo(() => createStyles(c), [c]);
  const cartScale = useRef(new Animated.Value(1)).current;
  const [menuOpen, setMenuOpen] = useState(false);

  const menuActions = useMemo(() => {
    const items: { key: string; label: string; icon: keyof typeof MaterialIcons.glyphMap; onPress?: () => void }[] = [];
    if (onShiftSummary) items.push({ key: 'summary', label: 'ملخص الوردية', icon: 'summarize', onPress: onShiftSummary });
    if (onOpenDrawer) {
      items.push({
        key: 'drawer',
        label: 'فتح الدرج',
        icon: 'account-balance-wallet',
        onPress: openDrawerBusy ? undefined : onOpenDrawer,
      });
    }
    if (onCloseShift) items.push({ key: 'close', label: 'إغلاق الوردية', icon: 'logout', onPress: onCloseShift });
    if (onOpenTables) items.push({ key: 'tables', label: 'الطاولات', icon: 'table-restaurant', onPress: onOpenTables });
    if (onCashMovement) items.push({ key: 'cash', label: 'حركة نقدية', icon: 'payments', onPress: onCashMovement });
    return items;
  }, [onShiftSummary, onOpenDrawer, openDrawerBusy, onCloseShift, onOpenTables, onCashMovement]);

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

        {menuActions.length > 0 ? (
          <Pressable onPress={() => setMenuOpen(true)} style={styles.menuBtn} accessibilityLabel="إجراءات الوردية">
            <MaterialIcons name="more-vert" size={22} color={c.text} />
          </Pressable>
        ) : null}
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

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menuSheet, rtlDirection]}>
            <Text style={styles.menuTitle}>إجراءات الوردية</Text>
            {menuActions.map((action) => (
              <Pressable
                key={action.key}
                style={styles.menuRow}
                onPress={() => {
                  setMenuOpen(false);
                  action.onPress?.();
                }}
              >
                <MaterialIcons name={action.icon} size={20} color={c.text} />
                <Text style={styles.menuRowLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
    menuBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borderSubtle,
      flexShrink: 0,
    },
    menuBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingTop: 64,
      paddingHorizontal: spacing.lg,
    },
    menuSheet: {
      minWidth: 220,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
      ...Platform.select({
        ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
        android: { elevation: 8 },
        default: {},
      }),
    },
    menuTitle: {
      ...textStart,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      color: c.textMuted,
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      fontWeight: '700',
    },
    menuRow: { ...flexRow, alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    menuRowLabel: { ...textStart, color: c.text, fontSize: typography.body, fontFamily: fonts.medium, fontWeight: '600' },
  });
}
