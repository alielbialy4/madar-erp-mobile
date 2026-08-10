import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { AppText } from '@/components/ui/AppText';
import { useToast } from '@/components/feedback';
import { FailedPosOrdersSheet } from './FailedPosOrdersSheet';
import { FailedTableOpsSheet } from './FailedTableOpsSheet';
import { FailedMutationsSheet } from './FailedMutationsSheet';
import { useColors } from '@/hooks/useColors';
import { useHeaderOfflineAttention } from '@/hooks/useHeaderOfflineAttention';
import { useNetworkStore } from '@/store/networkStore';
import { useBranchStore } from '@/store/branchStore';
import { usePosStore } from '@/store/posStore';
import { syncAll } from '@/services/sync/syncService';
import { notifySyncResult } from '@/services/sync/notifySyncResult';
import { dateText } from '@/utils/format';
import { flexRow, textStart } from '@/constants/layout';
import { HEADER_CHROME } from '@/constants/headerChrome';
import { elevation } from '@/constants/elevation';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

type Props = {
  compact?: boolean;
  showLabels?: boolean;
};

function MenuRow({
  label,
  icon,
  onPress,
  disabled,
  badge,
  tone,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  badge?: number;
  tone?: 'default' | 'warning';
}) {
  const c = useColors();
  const color = tone === 'warning' ? c.warning : c.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.menuRow,
        {
          backgroundColor: pressed ? c.surfaceMuted : 'transparent',
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <MaterialIcons name={icon} size={18} color={color} />
      <AppText style={[styles.menuLabel, { color }]} numberOfLines={1}>
        {label}
      </AppText>
      {badge && badge > 0 ? (
        <AppText style={[styles.menuBadge, { color: c.warning }]}>{badge > 99 ? '99+' : badge}</AppText>
      ) : null}
    </Pressable>
  );
}

export function HeaderSyncCluster({ compact = false, showLabels = false }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const toast = useToast();
  const attention = useHeaderOfflineAttention();
  const isOnline = useNetworkStore((s) => s.isOnline);
  const viewMode = useBranchStore((s) => s.viewMode);
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const refreshPendingOrders = usePosStore((s) => s.refreshPendingOrders);

  const [syncing, setSyncing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [failedPosOpen, setFailedPosOpen] = useState(false);
  const [failedTablesOpen, setFailedTablesOpen] = useState(false);
  const [failedMutOpen, setFailedMutOpen] = useState(false);

  const lastSyncLabel = attention.lastSuccessAt
    ? dateText(attention.lastSuccessAt)
    : t('header.syncNotCompletedYet');

  const handleSync = useCallback(async () => {
    if (syncing) return;
    if (!isOnline) {
      toast.show(t('header.offline'), 'warning');
      return;
    }
    if (viewMode === 'global' || !activeBranch?.id) {
      toast.show(t('Switch branch'), 'warning');
      return;
    }
    setSyncing(true);
    try {
      const result = await syncAll();
      notifySyncResult(result, toast);
      await refreshPendingOrders();
      await attention.refresh();
    } catch {
      toast.error(t('header.syncFailed', { count: 1 }));
    } finally {
      setSyncing(false);
    }
  }, [
    activeBranch?.id,
    attention,
    isOnline,
    refreshPendingOrders,
    syncing,
    t,
    toast,
    viewMode,
  ]);

  const openMenu = () => setMenuOpen(true);

  const syncIcon: keyof typeof MaterialIcons.glyphMap = attention.hasFailuresOrConflicts
    ? 'warning-amber'
    : 'sync';

  return (
    <>
      <View
        style={[
          styles.card,
          {
            backgroundColor: c.surface,
            borderColor: c.borderSubtle,
          },
          elevation(c, 'sm'),
        ]}
      >
        <View style={styles.status}>
          <View style={[styles.dot, { backgroundColor: isOnline ? c.success : c.danger }]} />
          {!compact ? (
            <AppText
              style={[styles.statusLabel, { color: isOnline ? c.success : c.danger }]}
              numberOfLines={1}
            >
              {isOnline ? t('header.online') : t('header.offline')}
            </AppText>
          ) : null}
        </View>
        <View style={[styles.divider, { backgroundColor: c.borderSubtle }]} />

        {showLabels ? (
          <>
            <Pressable
              onPress={() => void handleSync()}
              disabled={syncing || !isOnline}
              accessibilityRole="button"
              accessibilityLabel={t('header.syncNow')}
              style={({ pressed }) => [styles.syncBtn, pressed && { opacity: 0.75 }]}
            >
              {syncing ? (
                <ActivityIndicator size="small" color={c.textMuted} />
              ) : (
                <MaterialIcons
                  name={syncIcon}
                  size={18}
                  color={attention.hasFailuresOrConflicts ? c.warning : c.text}
                />
              )}
              <AppText style={[styles.syncLabel, { color: c.text }]} numberOfLines={1}>
                {syncing ? '…' : t('header.syncNow')}
              </AppText>
              {attention.attentionCount > 0 ? (
                <AppText style={[styles.count, { color: c.warning }]}>
                  {attention.attentionCount > 9 ? '9+' : attention.attentionCount}
                </AppText>
              ) : null}
            </Pressable>
            <View style={[styles.divider, { backgroundColor: c.borderSubtle }]} />
            <Pressable
              onPress={openMenu}
              accessibilityRole="button"
              accessibilityLabel={t('header.syncMenuAriaLabel')}
              style={({ pressed }) => [styles.menuBtn, pressed && { backgroundColor: c.surfaceMuted }]}
            >
              <MaterialIcons name="expand-more" size={18} color={c.textMuted} />
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={openMenu}
            onLongPress={() => void handleSync()}
            accessibilityRole="button"
            accessibilityLabel={t('header.syncMenuAriaLabel')}
            style={({ pressed }) => [styles.syncBtn, pressed && { opacity: 0.75 }]}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={c.textMuted} />
            ) : (
              <MaterialIcons
                name={syncIcon}
                size={18}
                color={attention.hasFailuresOrConflicts ? c.warning : c.text}
              />
            )}
            {attention.attentionCount > 0 ? (
              <AppText style={[styles.count, { color: c.warning }]}>
                {attention.attentionCount > 9 ? '9+' : attention.attentionCount}
              </AppText>
            ) : null}
          </Pressable>
        )}
      </View>

      <AppBottomSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('header.syncMenuTitle')}
        subtitle={`${t('header.offlineBootstrapStatus')}: ${lastSyncLabel}`}
      >
        <MenuRow
          label={t('header.syncNow')}
          icon="sync"
          disabled={syncing || !isOnline}
          onPress={() => {
            setMenuOpen(false);
            void handleSync();
          }}
        />
        <View style={[styles.sheetDivider, { backgroundColor: c.borderSubtle }]} />
        <MenuRow
          label={t('header.failedPosOrders')}
          icon="point-of-sale"
          disabled={attention.failedPosOrders === 0}
          badge={attention.failedPosOrders}
          tone="warning"
          onPress={() => {
            setMenuOpen(false);
            setFailedPosOpen(true);
          }}
        />
        <MenuRow
          label={t('header.failedTableOps')}
          icon="table-restaurant"
          disabled={attention.failedTableOps === 0}
          badge={attention.failedTableOps}
          tone="warning"
          onPress={() => {
            setMenuOpen(false);
            setFailedTablesOpen(true);
          }}
        />
        <MenuRow
          label={t('header.failedOtherOps')}
          icon="sync-problem"
          disabled={attention.otherOpsAttention === 0}
          badge={attention.otherOpsAttention}
          tone="warning"
          onPress={() => {
            setMenuOpen(false);
            setFailedMutOpen(true);
          }}
        />
      </AppBottomSheet>

      <FailedPosOrdersSheet
        visible={failedPosOpen}
        onClose={() => setFailedPosOpen(false)}
        onChanged={() => void attention.refresh()}
      />
      <FailedTableOpsSheet
        visible={failedTablesOpen}
        onClose={() => setFailedTablesOpen(false)}
        onChanged={() => void attention.refresh()}
      />
      <FailedMutationsSheet
        visible={failedMutOpen}
        onClose={() => setFailedMutOpen(false)}
        onChanged={() => void attention.refresh()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    ...flexRow,
    alignItems: 'center',
    minHeight: HEADER_CHROME.syncCardMinHeight,
    borderRadius: HEADER_CHROME.syncCardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flexShrink: 0,
  },
  status: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: HEADER_CHROME.syncCardMinHeight,
  },
  dot: {
    width: HEADER_CHROME.statusDot,
    height: HEADER_CHROME.statusDot,
    borderRadius: radius.pill,
  },
  statusLabel: { fontFamily: fonts.bold, fontSize: typography.caption },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  syncBtn: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: HEADER_CHROME.syncCardMinHeight,
  },
  syncLabel: { fontFamily: fonts.bold, fontSize: typography.caption, maxWidth: 88 },
  count: { fontFamily: fonts.bold, fontSize: typography.micro },
  menuBtn: {
    width: 32,
    minHeight: HEADER_CHROME.syncCardMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRow: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  menuLabel: {
    ...textStart,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: typography.body,
  },
  menuBadge: { fontFamily: fonts.bold, fontSize: typography.caption },
  sheetDivider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
});
