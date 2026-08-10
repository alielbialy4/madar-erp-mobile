import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui/AppText';
import { HeaderGhostIcon } from './HeaderGhostIcon';
import { HeaderClusterSeparator } from './HeaderClusterSeparator';
import { HeaderSyncCluster } from './HeaderSyncCluster';
import { HeaderLanguageSheet } from './HeaderLanguageSheet';
import { HeaderUserSheet } from './HeaderUserSheet';
import { useColors } from '@/hooks/useColors';
import { useThemeStore } from '@/store/themeStore';
import { useImmersiveStore } from '@/store/immersiveStore';
import { useAuthStore } from '@/store/authStore';
import { notificationsAPI } from '@/api/notifications';
import { extractData } from '@/utils/data';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import { flexRow, textStart } from '@/constants/layout';
import { HEADER_CHROME } from '@/constants/headerChrome';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

export type HeaderEndToolsInclude = {
  search?: boolean;
  notifications?: boolean;
  language?: boolean;
  theme?: boolean;
  fullscreen?: boolean;
  user?: boolean;
  sync?: boolean;
};

type Props = {
  onNavigate: (action: SidebarNavAction) => void;
  onOpenCommandPalette?: () => void;
  compact?: boolean;
  showLabels?: boolean;
  showSeparators?: boolean;
  include?: HeaderEndToolsInclude;
};

const DEFAULT_INCLUDE: Required<HeaderEndToolsInclude> = {
  search: true,
  notifications: true,
  language: true,
  theme: true,
  fullscreen: true,
  user: true,
  sync: true,
};

export function HeaderEndTools({
  onNavigate,
  onOpenCommandPalette,
  compact = false,
  showLabels = false,
  showSeparators = false,
  include,
}: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const flags = { ...DEFAULT_INCLUDE, ...include };
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const immersive = useImmersiveStore((s) => s.enabled);
  const toggleImmersive = useImmersiveStore((s) => s.toggle);
  const user = useAuthStore((s) => s.user);

  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = useCallback(async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      const payload = extractData<{ count?: number; unread_count?: number }>(
        response as { data?: { count?: number; unread_count?: number } },
      );
      const count = Number(payload?.count ?? payload?.unread_count ?? 0);
      setUnreadCount(Number.isFinite(count) ? count : 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    if (flags.notifications) void loadUnread();
  }, [flags.notifications, loadUnread]);

  const userName = user?.name?.trim() || t('header.defaultUser');
  const initial = userName.charAt(0).toUpperCase() || 'U';

  return (
    <>
      <View style={styles.row}>
        {flags.sync ? <HeaderSyncCluster compact={compact} showLabels={showLabels} /> : null}

        {showSeparators ? <HeaderClusterSeparator /> : null}

        {flags.language ? (
          <HeaderGhostIcon label={t('Language')} icon="translate" onPress={() => setLangOpen(true)} />
        ) : null}
        {flags.theme ? (
          <HeaderGhostIcon
            label={t('header.theme')}
            icon={theme === 'dark' ? 'light-mode' : 'dark-mode'}
            onPress={toggleTheme}
          />
        ) : null}
        {flags.fullscreen ? (
          <HeaderGhostIcon
            label={immersive ? t('header.exitFullscreen') : t('header.fullscreen')}
            icon={immersive ? 'fullscreen-exit' : 'fullscreen'}
            onPress={toggleImmersive}
          />
        ) : null}

        {flags.search && onOpenCommandPalette ? (
          <HeaderGhostIcon label={t('header.search')} icon="search" onPress={onOpenCommandPalette} />
        ) : null}
        {flags.notifications ? (
          <HeaderGhostIcon
            label={t('header.notifications')}
            icon="notifications-none"
            badge={unreadCount}
            onPress={() => onNavigate({ kind: 'more', screen: 'Notifications' })}
          />
        ) : null}

        {flags.user ? (
          <Pressable
            onPress={() => setUserOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={userName}
            style={({ pressed }) => [
              styles.userBtn,
              {
                backgroundColor: pressed ? c.surfaceMuted : 'transparent',
              },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: c.primary }]}>
              <AppText style={[styles.avatarText, { color: c.onPrimary }]}>{initial}</AppText>
            </View>
            {showLabels ? (
              <AppText style={[styles.userName, { color: c.text }]} numberOfLines={1}>
                {userName}
              </AppText>
            ) : null}
          </Pressable>
        ) : null}
      </View>

      <HeaderLanguageSheet visible={langOpen} onClose={() => setLangOpen(false)} />
      <HeaderUserSheet visible={userOpen} onClose={() => setUserOpen(false)} onNavigate={onNavigate} />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.xs,
    flexGrow: 0,
    flexShrink: 0,
  },
  userBtn: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: HEADER_CHROME.actionSize,
    paddingHorizontal: spacing.xs,
    borderRadius: HEADER_CHROME.actionRadius,
    maxWidth: 148,
  },
  avatar: {
    width: HEADER_CHROME.avatarSize,
    height: HEADER_CHROME.avatarSize,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 11 },
  userName: {
    ...textStart,
    fontFamily: fonts.medium,
    fontSize: typography.small,
    maxWidth: 100,
  },
});
