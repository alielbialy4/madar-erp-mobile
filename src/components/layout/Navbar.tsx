import React, { useCallback, useEffect, useState } from 'react';
import { Text } from '@/components/ui/AppText';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, isRtl, textStart } from '@/constants/layout';
import { chevronForwardIcon } from '@/utils/rtl';
import { spacing, radius, shadows } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore } from '@/store/networkStore';
import { useAuthStore } from '@/store/authStore';
import { usePosStore } from '@/store/posStore';
import { notificationsAPI } from '@/api/notifications';
import { useToast } from '@/components/feedback';
import { syncAll } from '@/services/sync/syncService';
import { notifySyncResult } from '@/services/sync/notifySyncResult';
import { extractData } from '@/utils/data';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import { RtlModalRoot } from '@/components/layout/RtlModalRoot';
import { BranchSwitcher, getBranchDisplayLabel } from '@/components/layout/BranchSwitcher';

const HEADER_HEIGHT_PHONE = 48;
const HEADER_HEIGHT_TABLET = 52;
const badgeCorner = isRtl ? { end: 2 } : { end: 2 };

type Props = {
  onMenuPress: () => void;
  onNavigate: (action: SidebarNavAction) => void;
  onOpenCommandPalette?: () => void;
  menuAccessibilityLabel?: string;
};

type IconButtonProps = {
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  children: React.ReactNode;
  style?: object;
};

function NavbarIconButton({ onPress, disabled, accessibilityLabel, children, style }: IconButtonProps) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          width: 40,
          height: 40,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.surfaceMuted,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Pressable>
  );
}

export function Navbar({ onMenuPress, onNavigate, onOpenCommandPalette, menuAccessibilityLabel = 'فتح القائمة' }: Props) {
  const c = useColors();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const headerHeight = isTablet ? HEADER_HEIGHT_TABLET : HEADER_HEIGHT_PHONE;

  const activeBranch = useBranchStore((s) => s.activeBranch);
  const viewMode = useBranchStore((s) => s.viewMode);
  const isOnline = useNetworkStore((s) => s.isOnline);
  const user = useAuthStore((s) => s.user);
  const refreshPendingOrders = usePosStore((s) => s.refreshPendingOrders);
  const pendingOrders = usePosStore((s) => s.pendingOrders);

  const [unreadCount, setUnreadCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const userName = user?.name ?? 'المستخدم';
  const attentionCount = pendingOrders.length;
  const branchLabel = getBranchDisplayLabel(viewMode, activeBranch);

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
    if (syncing) return;
    if (!isOnline) {
      toast.show('لا يوجد اتصال بالإنترنت', 'warning');
      return;
    }
    if (viewMode === 'global' || !activeBranch?.id) {
      toast.show('يجب اختيار فرع قبل المزامنة', 'warning');
      return;
    }
    setSyncing(true);
    try {
      const res = await syncAll();
      notifySyncResult(res, toast);
      await refreshPendingOrders();
      await loadUnread();
    } catch {
      toast.error('فشلت المزامنة');
    } finally {
      setSyncing(false);
    }
  }, [syncing, isOnline, viewMode, activeBranch?.id, toast, refreshPendingOrders, loadUnread]);

  return (
    <>
      <View
        style={{
          backgroundColor: c.surfaceHeader,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.borderSubtle,
          paddingHorizontal: isTablet ? spacing.lg : spacing.md,
          paddingTop: insets.top,
          zIndex: 30,
          ...shadows.sm,
        }}
      >
        <View style={{ ...flexRow, alignItems: 'center', minHeight: headerHeight, gap: spacing.sm }}>
          <NavbarIconButton onPress={onMenuPress} accessibilityLabel={menuAccessibilityLabel}>
            <MaterialIcons name="menu" size={22} color={c.text} />
          </NavbarIconButton>

          <BranchSwitcher />

          <View style={{ ...flexRow, alignItems: 'center', gap: spacing.xs, flexShrink: 0 }}>
            <NavbarIconButton
              onPress={() => void handleSync()}
              disabled={syncing}
              accessibilityLabel={isOnline ? 'متصل — مزامنة' : 'غير متصل'}
              style={{
                backgroundColor: isOnline ? `${c.success}14` : c.softDanger,
                borderColor: isOnline ? `${c.success}33` : c.softDangerBorder,
                position: 'relative',
              }}
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
            </NavbarIconButton>

            {onOpenCommandPalette ? (
              <NavbarIconButton onPress={onOpenCommandPalette} accessibilityLabel="بحث سريع">
                <MaterialIcons name="search" size={20} color={c.text} />
              </NavbarIconButton>
            ) : null}

            <NavbarIconButton
              onPress={() => onNavigate({ kind: 'more', screen: 'Notifications' })}
              accessibilityLabel="الإشعارات"
              style={{ position: 'relative' }}
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
            </NavbarIconButton>

            <Pressable
              onPress={() => setProfileOpen(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: c.primary,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: c.primarySoftBorder,
              }}
              accessibilityLabel="الملف الشخصي"
            >
              <Text style={{ color: c.primaryForeground, fontSize: 13, fontFamily: fonts.bold }}>
                {userName.charAt(0) || 'U'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal visible={profileOpen} transparent animationType="fade" onRequestClose={() => setProfileOpen(false)}>
        <RtlModalRoot>
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
        </RtlModalRoot>
      </Modal>
    </>
  );
}
