import React, { useCallback, useEffect, useState } from 'react';
import { Text } from '@/components/ui/AppText';
import {
  ActivityIndicator,
  I18nManager,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, textStart } from '@/constants/layout';
import { chevronForwardIcon } from '@/utils/rtl';
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

const HEADER_HEIGHT = 48;
const badgeCorner = I18nManager.isRTL ? { left: 2 } : { right: 2 };

type Props = {
  onMenuPress: () => void;
  onNavigate: (action: SidebarNavAction) => void;
  onOpenCommandPalette?: () => void;
};

export function Navbar({ onMenuPress, onNavigate, onOpenCommandPalette }: Props) {
  const c = useColors();
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
  const branchLabel = viewMode === 'global' ? 'كل الفروع' : activeBranch?.name ?? 'اختر الفرع';

  const loadUnread = useCallback(async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      const payload = extractData<{ count?: number; unread_count?: number }>(res as { data?: { count?: number; unread_count?: number } });
      const count = Number(payload?.count ?? payload?.unread_count ?? 0);
      setUnreadCount(Number.isFinite(count) ? count : 0);
    } catch { setUnreadCount(0); }
  }, []);

  useEffect(() => { void loadUnread(); void refreshPendingOrders(); }, [loadUnread, refreshPendingOrders]);

  const handleSync = useCallback(async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    try { await syncAll(); await refreshPendingOrders(); await loadUnread(); } finally { setSyncing(false); }
  }, [isOnline, syncing, refreshPendingOrders, loadUnread]);

  return (
    <>
      <View style={{
        backgroundColor: c.surfaceHeader,
        borderBottomWidth: 1,
        borderBottomColor: c.borderSubtle,
        paddingHorizontal: spacing.md,
        paddingTop: insets.top,
        zIndex: 30,
        ...Platform.select({
          ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 2 },
          android: { elevation: 2 },
          default: {},
        }),
      }}>
        <View style={{ ...flexRow, alignItems: 'center', minHeight: HEADER_HEIGHT, gap: spacing.sm }}>
          <Pressable
            onPress={onMenuPress}
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.surfaceMuted,
              borderWidth: 1,
              borderColor: c.borderSubtle,
            }}
            accessibilityLabel="فتح القائمة"
          >
            <MaterialIcons name="menu" size={22} color={c.text} />
          </Pressable>

          <Pressable
            onPress={() => setBranchOpen(true)}
            style={{
              ...flexRow,
              flex: 1,
              minWidth: 0,
              maxWidth: '58%',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.md,
              paddingVertical: 7,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: c.primarySoftBorder,
              backgroundColor: c.primarySoftMuted,
              opacity: branchLoading ? 0.7 : 1,
            }}
          >
            <MaterialIcons name={viewMode === 'global' ? 'public' : 'store'} size={15} color={c.primarySoftForeground} />
            <Text
              style={{
                ...textStart,
                flex: 1,
                fontSize: typography.caption,
                fontFamily: fonts.bold,
                fontWeight: '600',
                color: c.text,
              }}
              numberOfLines={1}
            >
              {branchLabel}
            </Text>
            <MaterialIcons name="expand-more" size={16} color={c.textMuted} />
          </Pressable>

          <View
            style={{
              ...flexRow,
              alignItems: 'center',
              gap: 0,
              flexShrink: 0,
              paddingHorizontal: 2,
              paddingVertical: 2,
              borderRadius: radius.xl,
              backgroundColor: c.surfaceMuted,
              borderWidth: 1,
              borderColor: c.borderSubtle,
            }}
          >
            <Pressable
              onPress={() => void handleSync()}
              disabled={!isOnline || syncing}
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isOnline ? `${c.success}14` : c.softDanger,
                position: 'relative',
              }}
              accessibilityLabel={isOnline ? 'متصل — مزامنة' : 'غير متصل'}
            >
              {syncing ? (
                <ActivityIndicator size="small" color={c.accent} />
              ) : (
                <MaterialIcons name={isOnline ? 'sync' : 'cloud-off'} size={18} color={isOnline ? c.success : c.danger} />
              )}
              {attentionCount > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 2,
                    ...badgeCorner,
                    minWidth: 15,
                    height: 15,
                    borderRadius: 8,
                    backgroundColor: c.warning,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: c.surface,
                  }}
                >
                  <Text style={{ fontSize: 8, fontFamily: fonts.bold, color: c.primaryForeground }}>
                    {attentionCount > 9 ? '9+' : attentionCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>

            {onOpenCommandPalette ? (
              <Pressable
                onPress={onOpenCommandPalette}
                style={{ width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }}
                accessibilityLabel="بحث سريع"
              >
                <MaterialIcons name="search" size={20} color={c.text} />
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => onNavigate({ kind: 'more', screen: 'Notifications' })}
              style={{ width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', position: 'relative' }}
              accessibilityLabel="الإشعارات"
            >
              <MaterialIcons name="notifications-none" size={20} color={c.text} />
              {unreadCount > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 2,
                    ...badgeCorner,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: c.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: c.surface,
                  }}
                >
                  <Text style={{ color: c.primaryForeground, fontSize: 9, fontFamily: fonts.bold }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>

            <Pressable
              onPress={() => setProfileOpen(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: c.primary,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: c.surface,
              }}
            >
              <Text style={{ color: c.primaryForeground, fontSize: 12, fontFamily: fonts.bold }}>
                {userName.charAt(0) || 'U'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal visible={branchOpen} transparent animationType="fade" onRequestClose={() => setBranchOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }} onPress={() => setBranchOpen(false)}>
          <View style={{ backgroundColor: c.surface, borderTopLeftRadius: radius.xxxl, borderTopRightRadius: radius.xxxl, padding: spacing.xl, gap: spacing.sm, paddingBottom: insets.bottom + spacing.lg }}>
            <Text style={{ ...textStart, fontSize: typography.sectionTitle, fontFamily: fonts.bold, color: c.text, marginBottom: spacing.sm }}>تبديل الفرع</Text>
            {user?.can_use_global_view ? (
              <Pressable style={{ ...flexRow, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: viewMode === 'global' ? c.softPrimary : 'transparent' }} onPress={() => void switchBranch(null).then(() => setBranchOpen(false))}>
                <Text style={{ ...textStart, flex: 1, fontSize: typography.body, fontFamily: fonts.medium, color: c.text }}>عرض عام — كل الفروع</Text>
              </Pressable>
            ) : null}
            {branches.map((b) => (
              <Pressable key={String(b.id)} style={{ ...flexRow, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: activeBranch?.id === b.id && viewMode === 'branch' ? c.softPrimary : 'transparent' }} onPress={() => void switchBranch(String(b.id)).then(() => setBranchOpen(false))}>
                <Text style={{ ...textStart, flex: 1, fontSize: typography.body, fontFamily: fonts.medium, color: c.text }}>{b.name}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={profileOpen} transparent animationType="fade" onRequestClose={() => setProfileOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }} onPress={() => setProfileOpen(false)}>
          <Pressable
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: radius.xxxl,
              borderTopRightRadius: radius.xxxl,
              overflow: 'hidden',
              paddingBottom: insets.bottom + spacing.lg,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ backgroundColor: c.primary, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
              <View style={{ ...flexRow, alignItems: 'center', gap: spacing.md }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: c.primaryForeground,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: c.primary, fontSize: 20, fontFamily: fonts.bold }}>{userName.charAt(0) || 'U'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...textStart, fontSize: typography.sectionTitle, fontFamily: fonts.bold, color: c.primaryForeground }}>
                    {userName}
                  </Text>
                  <Text style={{ ...textStart, fontSize: typography.tiny, fontFamily: fonts.medium, color: `${c.primaryForeground}CC`, marginTop: 2 }}>
                    {branchLabel}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.xs }}>
              {(
                [
                  { icon: 'person-outline' as const, label: 'الملف الشخصي', screen: 'Profile' as const },
                  { icon: 'settings' as const, label: 'الإعدادات', screen: 'Settings' as const },
                  { icon: 'sync' as const, label: 'حالة المزامنة', screen: 'SyncStatus' as const },
                ]
              ).map((row) => (
                <Pressable
                  key={row.screen}
                  style={{
                    ...flexRow,
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                    borderRadius: radius.xl,
                    backgroundColor: c.surfaceMuted,
                    borderWidth: 1,
                    borderColor: c.borderSubtle,
                  }}
                  onPress={() => {
                    setProfileOpen(false);
                    onNavigate({ kind: 'more', screen: row.screen });
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: radius.lg,
                      backgroundColor: c.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name={row.icon} size={20} color={c.accent} />
                  </View>
                  <Text style={{ ...textStart, flex: 1, fontSize: typography.body, fontFamily: fonts.medium, color: c.text }}>
                    {row.label}
                  </Text>
                  <MaterialIcons name={chevronForwardIcon()} size={20} color={c.textCaption} />
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
