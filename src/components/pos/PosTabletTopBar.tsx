import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { flexRow, rtlDirection, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore } from '@/store/networkStore';
import { backArrowIcon } from '@/utils/rtl';

type Props = {
  shiftLabel: string;
  cashierName?: string | null;
  lastSyncedLabel?: string | null;
  onExitPos: () => void;
  onSaveHoldCart?: () => void;
  onOpenHoldCarts?: () => void;
  onCashMovement?: () => void;
  onOpenTables?: () => void;
};

type MenuAction = {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
};

function TopBarAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <Pressable onPress={onPress} style={styles.quickActionBtn} accessibilityRole="button">
      <MaterialIcons name={icon} size={18} color={c.text} />
      <Text style={styles.quickActionLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

export function PosTabletTopBar({
  shiftLabel,
  cashierName,
  lastSyncedLabel,
  onExitPos,
  onSaveHoldCart,
  onOpenHoldCarts,
  onCashMovement,
  onOpenTables,
}: Props) {
  const isOnline = useNetworkStore((s) => s.isOnline);
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const viewMode = useBranchStore((s) => s.viewMode);
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [menuOpen, setMenuOpen] = useState(false);

  const branchLabel = viewMode === 'global' ? 'كل الفروع' : activeBranch?.name ?? 'بدون فرع';
  const metaLine = [branchLabel, isOnline ? 'متصل' : 'غير متصل', shiftLabel, cashierName].filter(Boolean).join(' · ');

  const menuActions = useMemo(() => {
    const items: MenuAction[] = [];
    if (onCashMovement) items.push({ key: 'cash', label: 'حركة نقدية', icon: 'payments', onPress: onCashMovement });
    return items;
  }, [onCashMovement]);

  return (
    <>
      <View style={[styles.bar, rtlDirection]}>
        <Pressable onPress={onExitPos} style={styles.exitPosBtn} accessibilityRole="button">
          <MaterialIcons name={backArrowIcon()} size={20} color={c.danger} />
          <Text style={styles.exitPosLabel}>خروج من نقطة البيع</Text>
        </Pressable>

        <View style={styles.quickActions}>
          {onOpenTables ? <TopBarAction label="الطاولات" icon="table-restaurant" onPress={onOpenTables} /> : null}
          {onOpenHoldCarts ? <TopBarAction label="السلات" icon="inventory-2" onPress={onOpenHoldCarts} /> : null}
          {onSaveHoldCart ? <TopBarAction label="حفظ السلة" icon="pause-circle-outline" onPress={onSaveHoldCart} /> : null}
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaLine} numberOfLines={1}>
            {metaLine}
          </Text>
          {lastSyncedLabel ? (
            <Text style={styles.synced} numberOfLines={1}>
              {lastSyncedLabel}
            </Text>
          ) : null}
        </View>

        {menuActions.length > 0 ? (
          <Pressable onPress={() => setMenuOpen(true)} style={styles.menuBtn} accessibilityLabel="إجراءات نقطة البيع">
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
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      minHeight: 52,
    },
    quickActions: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 1,
      minWidth: 0,
    },
    quickActionBtn: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 44,
      maxWidth: 120,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    quickActionLabel: {
      ...textStart,
      color: c.text,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '700',
    },
    exitPosBtn: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: c.softDanger,
      borderWidth: 1,
      borderColor: c.softDangerBorder,
      flexShrink: 0,
    },
    exitPosLabel: {
      ...textStart,
      color: c.danger,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '700',
    },
    meta: { flex: 1, minWidth: 0, gap: 2, paddingHorizontal: spacing.xs },
    metaLine: { ...textStart, fontSize: typography.small, fontFamily: fonts.medium, color: c.text },
    synced: { ...textStart, fontSize: typography.tiny, color: c.textCaption, fontFamily: fonts.regular },
    menuBtn: {
      width: 44,
      height: 44,
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
      paddingTop: 56,
      paddingHorizontal: spacing.md,
    },
    menuSheet: {
      minWidth: 220,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
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
