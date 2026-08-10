import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { flexRow, rtlDirection, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useBranchStore } from '@/store/branchStore';
import { POS_HOLD_CARTS_ENABLED } from '@/constants/posFeatures';
import { backArrowIcon } from '@/utils/rtl';
import {
  PosOnlineChip,
  PosShiftChip,
  posHeaderElevation,
  usePosHeaderBarStyle,
} from '@/components/pos/posHeaderUi';
import { HeaderEndTools } from '@/components/layout/header';
import { BranchSwitcher } from '@/components/layout/BranchSwitcher';
import { useNavShell } from '@/navigation/NavShellContext';
import { useImmersiveStore } from '@/store/immersiveStore';

type Props = {
  shiftLabel: string;
  hasShift?: boolean;
  cashierName?: string | null;
  lastSyncedLabel?: string | null;
  onExitPos: () => void;
  onSaveHoldCart?: () => void;
  onOpenHoldCarts?: () => void;
  onCashMovement?: () => void;
  onOpenTables?: () => void;
  onShiftSummary?: () => void;
  onCloseShift?: () => void;
  onOpenDrawer?: () => void;
  openDrawerBusy?: boolean;
};

type MenuAction = {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
};

function QuickAction({
  label,
  icon,
  onPress,
  accent,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
  accent?: boolean;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.quickActionBtn, accent && styles.quickActionAccent]}
      accessibilityRole="button"
    >
      <View style={[styles.quickActionIcon, accent && styles.quickActionIconAccent]}>
        <MaterialIcons name={icon} size={18} color={accent ? c.accent : c.text} />
      </View>
      <Text style={[styles.quickActionLabel, accent && styles.quickActionLabelAccent]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function PosTabletTopBar({
  shiftLabel,
  hasShift = false,
  cashierName,
  lastSyncedLabel,
  onExitPos,
  onSaveHoldCart,
  onOpenHoldCarts,
  onCashMovement,
  onOpenTables,
  onShiftSummary,
  onCloseShift,
  onOpenDrawer,
  openDrawerBusy = false,
}: Props) {
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const viewMode = useBranchStore((s) => s.viewMode);
  const c = useColors();
  const bar = usePosHeaderBarStyle();
  const styles = useMemo(() => createStyles(c), [c]);
  const [menuOpen, setMenuOpen] = useState(false);
  const { navigate } = useNavShell();
  const immersive = useImmersiveStore((s) => s.enabled);

  const branchLabel = viewMode === 'global' ? 'كل الفروع' : activeBranch?.name ?? 'بدون فرع';
  const metaParts = [cashierName, lastSyncedLabel ? `آخر مزامنة ${lastSyncedLabel}` : null].filter(Boolean);

  const menuActions = useMemo(() => {
    const items: MenuAction[] = [];
    if (onCashMovement) items.push({ key: 'cash', label: 'حركة نقدية', icon: 'payments', onPress: onCashMovement });
    return items;
  }, [onCashMovement]);

  const toolbarActions = useMemo(() => {
    const items: {
      key: string;
      label: string;
      icon: keyof typeof MaterialIcons.glyphMap;
      onPress?: () => void;
      accent?: boolean;
    }[] = [];
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
    if (onOpenTables) items.push({ key: 'tables', label: 'الطاولات', icon: 'table-restaurant', onPress: onOpenTables, accent: true });
    if (onOpenHoldCarts && POS_HOLD_CARTS_ENABLED) {
      items.push({ key: 'hold-list', label: 'السلات', icon: 'inventory-2', onPress: onOpenHoldCarts });
    }
    if (onSaveHoldCart && POS_HOLD_CARTS_ENABLED) {
      items.push({ key: 'hold-save', label: 'حفظ', icon: 'pause-circle-outline', onPress: onSaveHoldCart });
    }
    return items;
  }, [onShiftSummary, onOpenDrawer, openDrawerBusy, onCloseShift, onOpenTables, onOpenHoldCarts, onSaveHoldCart]);

  if (immersive) return null;

  return (
    <>
      <View style={[styles.bar, rtlDirection]}>
        <Pressable onPress={onExitPos} style={styles.exitBtn} accessibilityRole="button" accessibilityLabel="خروج من نقطة البيع">
          <MaterialIcons name={backArrowIcon()} size={20} color={c.danger} />
        </Pressable>

        <View style={styles.branchSlot}>
          <BranchSwitcher density="pill" />
        </View>

        <View style={styles.main}>
          <View style={styles.center}>
            <View style={styles.centerTop}>
              <Text style={bar.branchName} numberOfLines={1}>
                {branchLabel}
              </Text>
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
          </View>

          {toolbarActions.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.actionsScroll}
              contentContainerStyle={[styles.actionsRow, rtlDirection]}
            >
              {toolbarActions.map((action) => (
                <QuickAction
                  key={action.key}
                  label={action.label}
                  icon={action.icon}
                  onPress={action.onPress}
                  accent={action.accent}
                />
              ))}
            </ScrollView>
          ) : null}
        </View>

        <HeaderEndTools
          onNavigate={navigate}
          compact={false}
          showLabels
          showSeparators
          include={{ search: false, notifications: true }}
        />

        {menuActions.length > 0 ? (
          <Pressable onPress={() => setMenuOpen(true)} style={styles.menuBtn} accessibilityLabel="إجراءات إضافية">
            <MaterialIcons name="more-vert" size={22} color={c.text} />
          </Pressable>
        ) : null}
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menuSheet, rtlDirection]}>
            <Text style={styles.menuTitle}>إجراءات إضافية</Text>
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
    </>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    bar: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: c.surfaceHeader ?? c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      minHeight: 60,
      ...posHeaderElevation(c),
    },
    branchSlot: { flexShrink: 1, maxWidth: 220, minWidth: 0 },
    main: {
      flex: 1,
      minWidth: 0,
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
    },
    actionsScroll: {
      flex: 1,
      minWidth: 0,
      flexGrow: 1,
    },
    actionsRow: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 2,
    },
    exitBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.control,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.danger,
      flexShrink: 0,
    },
    center: { flexShrink: 1, minWidth: 88, maxWidth: '38%', gap: 2 },
    centerTop: { ...flexRow, alignItems: 'center', gap: spacing.sm },
    chips: { ...flexRow, alignItems: 'center', gap: spacing.xs, flexShrink: 0 },
    quickActionBtn: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.control,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      flexShrink: 0,
    },
    quickActionAccent: {
      backgroundColor: c.surface,
      borderColor: c.accent,
    },
    quickActionIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.control,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
    },
    quickActionIconAccent: {
      borderColor: c.accent,
    },
    quickActionLabel: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
    },
    quickActionLabelAccent: {
      color: c.accent,
    },
    menuBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.control,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
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
      borderRadius: radius.sheet,
      borderWidth: StyleSheet.hairlineWidth,
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
