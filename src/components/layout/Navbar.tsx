import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, textStart } from '@/constants/layout';
import type { AppColors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore } from '@/store/networkStore';
import { useAuthStore } from '@/store/authStore';
import { usePosStore } from '@/store/posStore';
import { notificationsAPI } from '@/api/notifications';
import { syncAll } from '@/services/sync/syncService';
import { extractData } from '@/utils/data';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
const HEADER_HEIGHT = 52;

type Props = {
  onMenuPress: () => void;
  onNavigate: (action: SidebarNavAction) => void;
  onOpenCommandPalette?: () => void;
};

export function Navbar({ onMenuPress, onNavigate, onOpenCommandPalette }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const insets = useSafeAreaInsets();

  const activeBranch = useBranchStore((s) => s.activeBranch);
  const branches = useBranchStore((s) => s.branches);
  const viewMode = useBranchStore((s) => s.viewMode);
  const switchBranch = useBranchStore((s) => s.switchBranch);
  const branchLoading = useBranchStore((s) => s.loading);
  const isOnline = useNetworkStore((s) => s.isOnline);
  const user = useAuthStore((s) => s.user);
  const refreshPendingOrders = usePosStore((s) => s.refreshPendingOrders);
  const pendingOrders = usePosStore((s) => s.pendingOrders);

  const [unreadCount, setUnreadCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const userName = user?.name ?? 'المستخدم';
  const attentionCount = pendingOrders.length;

  const branchLabel =
    viewMode === 'global' ? 'كل الفروع' : activeBranch?.name ?? 'اختر الفرع';

  const loadUnread = useCallback(async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      const payload = extractData<{ count?: number; unread_count?: number }>(
        res as { data?: { count?: number; unread_count?: number } },
      );
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
    if (!isOnline || syncing) return;
    setSyncing(true);
    try {
      await syncAll();
      await refreshPendingOrders();
      await loadUnread();
    } finally {
      setSyncing(false);
    }
  }, [isOnline, syncing, refreshPendingOrders, loadUnread]);

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.row}>
          <Pressable
            onPress={onMenuPress}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            accessibilityLabel="فتح القائمة"
          >
            <MaterialIcons name="menu" size={22} color={c.text} />
          </Pressable>

          <Pressable
            onPress={() => setBranchOpen(true)}
            style={[styles.branchChip, branchLoading && styles.branchChipLoading]}
            disabled={branchLoading}
          >
            <MaterialIcons
              name={viewMode === 'global' ? 'public' : 'store'}
              size={16}
              color={c.primarySoftForeground}
            />
            <Text style={styles.branchText} numberOfLines={1}>
              {branchLabel}
            </Text>
            <MaterialIcons name="expand-more" size={16} color={c.textMuted} />
          </Pressable>

          <View style={styles.actions}>
            <Pressable
              onPress={() => void handleSync()}
              disabled={!isOnline || syncing}
              style={({ pressed }) => [
                styles.statusChip,
                isOnline ? styles.statusOnline : styles.statusOffline,
                pressed && styles.iconBtnPressed,
              ]}
              accessibilityLabel={isOnline ? 'متصل — مزامنة' : 'غير متصل'}
            >
              {syncing ? (
                <ActivityIndicator size="small" color={c.accent} />
              ) : (
                <MaterialIcons
                  name={isOnline ? 'wifi' : 'wifi-off'}
                  size={14}
                  color={isOnline ? c.success : c.danger}
                />
              )}
              {attentionCount > 0 ? (
                <View style={styles.syncBadge}>
                  <Text style={styles.syncBadgeText}>{attentionCount > 9 ? '9+' : attentionCount}</Text>
                </View>
              ) : null}
            </Pressable>

            {onOpenCommandPalette ? (
              <Pressable
                onPress={onOpenCommandPalette}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                accessibilityLabel="بحث الشاشات"
              >
                <MaterialIcons name="search" size={22} color={c.text} />
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => onNavigate({ kind: 'more', screen: 'Notifications' })}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              accessibilityLabel="الإشعارات"
            >
              <MaterialIcons name="notifications-none" size={22} color={c.text} />
              {unreadCount > 0 ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>

            <Pressable
              onPress={() => setProfileOpen(true)}
              style={({ pressed }) => [styles.avatarBtn, pressed && styles.iconBtnPressed]}
              accessibilityLabel="الحساب"
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userName.charAt(0) || 'U'}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal visible={branchOpen} transparent animationType="fade" onRequestClose={() => setBranchOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setBranchOpen(false)}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <Text style={styles.modalTitle}>تبديل الفرع</Text>
            {user?.can_use_global_view ? (
              <Pressable
                style={[styles.modalRow, viewMode === 'global' && styles.modalRowActive]}
                onPress={() => void switchBranch(null).then(() => setBranchOpen(false))}
              >
                <Text style={styles.modalRowText}>عرض عام — كل الفروع</Text>
              </Pressable>
            ) : null}
            {branches.map((b) => (
              <Pressable
                key={String(b.id)}
                style={[styles.modalRow, activeBranch?.id === b.id && viewMode === 'branch' && styles.modalRowActive]}
                onPress={() => void switchBranch(String(b.id)).then(() => setBranchOpen(false))}
              >
                <Text style={styles.modalRowText}>{b.name}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={profileOpen} transparent animationType="fade" onRequestClose={() => setProfileOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setProfileOpen(false)}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <Text style={styles.modalTitle}>{userName}</Text>
            <Pressable
              style={styles.modalRow}
              onPress={() => {
                setProfileOpen(false);
                onNavigate({ kind: 'more', screen: 'Profile' });
              }}
            >
              <MaterialIcons name="person-outline" size={20} color={c.icon} />
              <Text style={styles.modalRowText}>الملف الشخصي</Text>
            </Pressable>
            <Pressable
              style={styles.modalRow}
              onPress={() => {
                setProfileOpen(false);
                onNavigate({ kind: 'more', screen: 'Settings' });
              }}
            >
              <MaterialIcons name="settings" size={20} color={c.icon} />
              <Text style={styles.modalRowText}>الإعدادات</Text>
            </Pressable>
            <Pressable
              style={styles.modalRow}
              onPress={() => {
                setProfileOpen(false);
                onNavigate({ kind: 'more', screen: 'SyncStatus' });
              }}
            >
              <MaterialIcons name="sync" size={20} color={c.icon} />
              <Text style={styles.modalRowText}>حالة المزامنة</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    header: {
      backgroundColor: c.surfaceHeader,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      paddingHorizontal: spacing.sm,
      zIndex: 30,
      ...Platform.select({
        ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 2 },
        android: { elevation: 2 },
        default: {},
      }),
    },
    row: {
      ...flexRow,
      alignItems: 'center',
      minHeight: HEADER_HEIGHT,
      gap: spacing.xs,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnPressed: { backgroundColor: c.surfaceMuted },
    branchChip: {
      ...flexRow,
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.primarySoftBorder,
      backgroundColor: c.primarySoftMuted,
      maxWidth: '100%',
    },
    branchChipLoading: { opacity: 0.7 },
    branchText: {
      ...textStart,
      flex: 1,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '600',
      color: c.text,
    },
    actions: {
      ...flexRow,
      alignItems: 'center',
      gap: 2,
      flexShrink: 0,
    },
    statusChip: {
      width: 40,
      height: 40,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    statusOnline: {
      borderColor: `${c.success}40`,
      backgroundColor: `${c.success}14`,
    },
    statusOffline: {
      borderColor: `${c.danger}40`,
      backgroundColor: c.softDanger,
    },
    syncBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: c.warning,
      alignItems: 'center',
      justifyContent: 'center',
    },
    syncBadgeText: {
      fontSize: 8,
      fontFamily: fonts.bold,
      color: c.primaryForeground,
    },
    notifBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: c.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notifBadgeText: {
      color: c.primaryForeground,
      fontSize: 9,
      fontFamily: fonts.bold,
    },
    avatarBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: c.primaryForeground,
      fontSize: 12,
      fontFamily: fonts.bold,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    modalTitle: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.bold,
      color: c.text,
      marginBottom: spacing.sm,
    },
    modalRow: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
    },
    modalRowActive: { backgroundColor: c.softPrimary },
    modalRowText: {
      ...textStart,
      flex: 1,
      fontSize: typography.body,
      fontFamily: fonts.medium,
      color: c.text,
    },
  });
}
