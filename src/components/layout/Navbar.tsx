import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/AppText';
import { BranchSwitcher } from '@/components/layout/BranchSwitcher';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { getProductLayoutTier, isProductTablet } from '@/constants/productLayout';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore } from '@/store/networkStore';
import { usePosStore } from '@/store/posStore';
import { notificationsAPI } from '@/api/notifications';
import { useToast } from '@/components/feedback';
import { syncAll } from '@/services/sync/syncService';
import { notifySyncResult } from '@/services/sync/notifySyncResult';
import { extractData } from '@/utils/data';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';

type Props = {
  onMenuPress: () => void;
  onNavigate: (action: SidebarNavAction) => void;
  onOpenCommandPalette?: () => void;
  menuAccessibilityLabel?: string;
};

type HeaderActionProps = {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  badge?: number;
};

function HeaderAction({ label, icon, onPress, badge }: HeaderActionProps) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconAction, pressed && { backgroundColor: c.surfaceMuted }]}
    >
      <MaterialIcons name={icon} size={21} color={c.text} />
      {badge ? (
        <View style={[styles.badge, { backgroundColor: c.danger, borderColor: c.surfaceHeader }]}>
          <AppText style={[styles.badgeText, { color: c.onPrimary }]}>{badge > 99 ? '99+' : badge}</AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Navbar({ onMenuPress, onNavigate, onOpenCommandPalette, menuAccessibilityLabel = 'فتح القائمة' }: Props) {
  const c = useColors();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tier = getProductLayoutTier(width);
  const tablet = isProductTablet(tier);
  const compact = tier === 'compactPhone';

  const activeBranch = useBranchStore((state) => state.activeBranch);
  const viewMode = useBranchStore((state) => state.viewMode);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const refreshPendingOrders = usePosStore((state) => state.refreshPendingOrders);
  const pendingOrders = usePosStore((state) => state.pendingOrders);

  const [unreadCount, setUnreadCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const loadUnread = useCallback(async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      const payload = extractData<{ count?: number; unread_count?: number }>(response as { data?: { count?: number; unread_count?: number } });
      const count = Number(payload?.count ?? payload?.unread_count ?? 0);
      setUnreadCount(Number.isFinite(count) ? count : 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    void loadUnread();
    void refreshPendingOrders();
  }, [loadUnread, refreshPendingOrders]);

  const handleSync = useCallback(async () => {
    if (syncing) return;
    if (!isOnline) {
      toast.show('لا يوجد اتصال بالإنترنت', 'warning');
      return;
    }
    if (viewMode === 'global' || !activeBranch?.id) {
      toast.show('اختر فرعًا قبل المزامنة', 'warning');
      return;
    }
    setSyncing(true);
    try {
      const result = await syncAll();
      notifySyncResult(result, toast);
      await refreshPendingOrders();
      await loadUnread();
    } catch {
      toast.error('فشلت المزامنة');
    } finally {
      setSyncing(false);
    }
  }, [activeBranch?.id, isOnline, loadUnread, refreshPendingOrders, syncing, toast, viewMode]);

  const syncAttention = pendingOrders.length;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingHorizontal: tablet ? spacing.lg : spacing.sm,
          backgroundColor: c.surfaceHeader,
          borderBottomColor: c.border,
        },
      ]}
    >
      <View style={styles.row}>
        <HeaderAction label={menuAccessibilityLabel} icon="menu" onPress={onMenuPress} />

        <BranchSwitcher />

        <Pressable
          onPress={() => void handleSync()}
          disabled={syncing}
          accessibilityRole="button"
          accessibilityLabel={isOnline ? 'متصل، مزامنة الآن' : 'غير متصل'}
          style={({ pressed }) => [
            styles.syncState,
            {
              backgroundColor: isOnline ? c.softSuccess : c.softDanger,
              borderColor: isOnline ? c.softSuccessBorder : c.softDangerBorder,
            },
            pressed && { opacity: 0.75 },
          ]}
        >
          {syncing ? (
            <ActivityIndicator size="small" color={c.textMuted} />
          ) : (
            <View style={[styles.statusDot, { backgroundColor: isOnline ? c.success : c.danger }]} />
          )}
          {!compact ? (
            <AppText style={[styles.syncLabel, { color: isOnline ? c.success : c.danger }]} numberOfLines={1}>
              {syncing ? 'مزامنة' : isOnline ? 'متصل' : 'غير متصل'}
            </AppText>
          ) : null}
          {syncAttention > 0 ? (
            <AppText style={[styles.syncCount, { color: c.warning }]}>{syncAttention > 9 ? '9+' : syncAttention}</AppText>
          ) : null}
        </Pressable>

        {onOpenCommandPalette ? (
          <HeaderAction label="بحث سريع" icon="search" onPress={onOpenCommandPalette} />
        ) : null}
        <HeaderAction
          label="الإشعارات"
          icon="notifications-none"
          badge={unreadCount}
          onPress={() => onNavigate({ kind: 'more', screen: 'Notifications' })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderBottomWidth: StyleSheet.hairlineWidth, zIndex: 30 },
  row: { ...flexRow, minHeight: 56, alignItems: 'center', gap: spacing.xs },
  iconAction: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    end: 1,
    minWidth: 16,
    height: 16,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 8, lineHeight: 10 },
  syncState: {
    ...flexRow,
    minHeight: 36,
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusDot: { width: 8, height: 8, borderRadius: radius.pill },
  syncLabel: { fontFamily: fonts.bold, fontSize: typography.caption },
  syncCount: { fontFamily: fonts.bold, fontSize: typography.micro },
});
