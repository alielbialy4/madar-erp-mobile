import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui';
import { useAppDialog, useToast } from '@/components/feedback';
import { useColors } from '@/hooks/useColors';
import { useNetworkStore } from '@/store/networkStore';
import {
  getFailedTableOps,
  moveFailedTableOpsToPending,
  removeFailedTableOpById,
  type OfflineTableOp,
} from '@/services/offline/tableOps';
import { syncAll } from '@/services/sync/syncService';
import { dateText } from '@/utils/format';
import { flexRow, textStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  onChanged?: () => void;
};

export function FailedTableOpsSheet({ visible, onClose, onChanged }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const toast = useToast();
  const dialog = useAppDialog();
  const isOnline = useNetworkStore((s) => s.isOnline);
  const [rows, setRows] = useState<OfflineTableOp[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRows(await getFailedTableOps());
  }, []);

  useEffect(() => {
    if (visible) void load();
  }, [load, visible]);

  const notify = useCallback(async () => {
    await load();
    onChanged?.();
  }, [load, onChanged]);

  const retryOne = async (row: OfflineTableOp) => {
    if (!isOnline || busy) return;
    setBusy(true);
    try {
      await moveFailedTableOpsToPending(new Set([row.id]));
      await syncAll();
      await notify();
      toast.success(t('header.retry'));
    } catch {
      toast.error(t('header.syncFailed', { count: 1 }));
    } finally {
      setBusy(false);
    }
  };

  const dismissOne = async (row: OfflineTableOp) => {
    const ok = await dialog.confirm({
      title: t('header.dismiss'),
      message: row.op_type,
      destructive: true,
      confirmLabel: t('header.dismiss'),
      cancelLabel: t('header.cancel'),
    });
    if (!ok) return;
    setBusy(true);
    try {
      await removeFailedTableOpById(row.id);
      await notify();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} title={t('header.failedTableOps')} size="form">
      {busy ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} />
        </View>
      ) : null}
      {rows.length === 0 ? (
        <AppText style={[styles.empty, { color: c.textMuted }]}>{t('header.emptyFailedTables')}</AppText>
      ) : (
        rows.map((row) => (
          <View key={row.id} style={[styles.card, { borderColor: c.borderSubtle }]}>
            <AppText style={[styles.title, { color: c.text }]}>{row.op_type}</AppText>
            <AppText style={[styles.meta, { color: c.textMuted }]}>{dateText(row.created_at_local)}</AppText>
            <AppText style={[styles.reason, { color: c.danger }]}>{row.last_error ?? '—'}</AppText>
            <View style={styles.actions}>
              <AppButton
                title={t('header.retry')}
                size="sm"
                variant="secondary"
                disabled={!isOnline || busy}
                onPress={() => void retryOne(row)}
              />
              <AppButton
                title={t('header.dismiss')}
                size="sm"
                variant="danger"
                disabled={busy}
                onPress={() => void dismissOne(row)}
              />
            </View>
          </View>
        ))
      )}
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: spacing.lg, alignItems: 'center' },
  empty: { ...textStart, fontFamily: fonts.regular, fontSize: typography.body, paddingVertical: spacing.lg },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: { ...textStart, fontFamily: fonts.bold, fontSize: typography.small },
  meta: { ...textStart, fontFamily: fonts.regular, fontSize: typography.tiny },
  reason: { ...textStart, fontFamily: fonts.bold, fontSize: typography.small },
  actions: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
});
