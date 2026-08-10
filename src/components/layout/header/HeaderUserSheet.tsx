import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { AppText } from '@/components/ui/AppText';
import { useAppDialog, useToast } from '@/components/feedback';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { clearLocalSessionData } from '@/services/session/clearLocalSessionData';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import { flexRow, textStart } from '@/constants/layout';
import { HEADER_CHROME } from '@/constants/headerChrome';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (action: SidebarNavAction) => void;
};

function Row({
  icon,
  label,
  onPress,
  tone = 'default',
  trailing,
  disabled,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'warning' | 'danger';
  trailing?: React.ReactNode;
  disabled?: boolean;
}) {
  const c = useColors();
  const color = tone === 'danger' ? c.danger : tone === 'warning' ? c.warning : c.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? c.surfaceMuted : 'transparent', opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <MaterialIcons name={icon} size={18} color={color} />
      <AppText style={[styles.rowLabel, { color }]} numberOfLines={1}>
        {label}
      </AppText>
      {trailing}
    </Pressable>
  );
}

export function HeaderUserSheet({ visible, onClose, onNavigate }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const dialog = useAppDialog();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  const name = user?.name?.trim() || t('header.defaultUser');
  const role = user?.roles?.[0] ?? '';
  const showTenantSettings = Boolean(
    user?.is_super_admin || hasPermission(user, 'manage_settings'),
  );
  const initial = name.charAt(0).toUpperCase() || 'U';

  const handleClearCache = async () => {
    const ok = await dialog.confirm({
      title: t('header.clearCache'),
      message: t('header.clearCacheDescription'),
      confirmLabel: t('header.clearCache'),
      cancelLabel: t('header.cancel'),
      tone: 'warning',
      icon: 'delete-sweep',
    });
    if (!ok) return;
    onClose();
    try {
      await clearLocalSessionData();
      await logout();
    } catch {
      toast.error(t('header.clearCache'));
    }
  };

  const handleLogout = async () => {
    const ok = await dialog.confirm({
      title: t('header.logout'),
      message: t('header.logout'),
      confirmLabel: t('header.logout'),
      cancelLabel: t('header.cancel'),
      destructive: true,
      icon: 'logout',
    });
    if (!ok) return;
    onClose();
    await logout();
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      if (!Updates.isEnabled) {
        toast.show(t('header.updatesUnavailable'), 'warning');
        return;
      }
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        toast.show(t('header.noUpdates'), 'info');
        return;
      }
      await Updates.fetchUpdateAsync();
      toast.success(t('header.updateReady'));
      await Updates.reloadAsync();
    } catch {
      toast.show(t('header.updatesUnavailable'), 'warning');
    } finally {
      setCheckingUpdates(false);
    }
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} title={t('header.defaultUser')}>
      <View style={[styles.header, { borderBottomColor: c.borderSubtle }]}>
        <View style={[styles.avatar, { backgroundColor: c.primary }]}>
          <AppText style={[styles.avatarText, { color: c.onPrimary }]}>{initial}</AppText>
        </View>
        <View style={styles.headerCopy}>
          <AppText style={[styles.name, { color: c.text }]} numberOfLines={1}>
            {name}
          </AppText>
          {role ? (
            <AppText style={[styles.role, { color: c.textMuted }]} numberOfLines={1}>
              {role}
            </AppText>
          ) : null}
        </View>
      </View>

      <Row
        icon="person-outline"
        label={t('header.profile')}
        onPress={() => {
          onClose();
          onNavigate({ kind: 'more', screen: 'Profile' });
        }}
      />
      {showTenantSettings ? (
        <Row
          icon="settings"
          label={t('header.tenantSettings')}
          onPress={() => {
            onClose();
            onNavigate({ kind: 'more', screen: 'TenantSettings' });
          }}
        />
      ) : null}
      <Row
        icon="system-update"
        label={t('header.checkForUpdates')}
        disabled={checkingUpdates}
        trailing={checkingUpdates ? <ActivityIndicator size="small" color={c.textMuted} /> : null}
        onPress={() => void handleCheckUpdates()}
      />

      <View style={[styles.divider, { backgroundColor: c.borderSubtle }]} />
      <Row
        icon="delete-sweep"
        label={t('header.clearCache')}
        tone="warning"
        onPress={() => void handleClearCache()}
      />
      <View style={[styles.divider, { backgroundColor: c.borderSubtle }]} />
      <Row icon="logout" label={t('header.logout')} tone="danger" onPress={() => void handleLogout()} />
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: HEADER_CHROME.avatarSize + 4,
    height: HEADER_CHROME.avatarSize + 4,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: typography.body },
  headerCopy: { flex: 1, minWidth: 0, gap: 2 },
  name: { ...textStart, fontFamily: fonts.bold, fontSize: typography.body },
  role: { ...textStart, fontFamily: fonts.regular, fontSize: typography.caption, textTransform: 'capitalize' },
  row: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  rowLabel: { ...textStart, flex: 1, fontFamily: fonts.medium, fontSize: typography.body },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
});
