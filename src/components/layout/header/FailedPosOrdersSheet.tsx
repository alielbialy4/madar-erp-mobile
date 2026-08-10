import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui';
import { useAppDialog, useToast } from '@/components/feedback';
import { useColors } from '@/hooks/useColors';
import { useNetworkStore } from '@/store/networkStore';
import { usePosStore } from '@/store/posStore';
import { getPendingOrders, removePendingOrders, retryFailedOrders } from '@/services/offline/posOrders';
import { syncAll } from '@/services/sync/syncService';
import type { OfflinePosOrderRecord } from '@/types/offline';
import { dateText, money, numberText } from '@/utils/format';
import { flexRow, textStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  onChanged?: () => void;
};

export function FailedPosOrdersSheet({ visible, onClose, onChanged }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const toast = useToast();
  const dialog = useAppDialog();
  const isOnline = useNetworkStore((s) => s.isOnline);
  const refreshPendingOrders = usePosStore((s) => s.refreshPendingOrders);
  const [orders, setOrders] = useState<OfflinePosOrderRecord[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const all = await getPendingOrders();
    setOrders(all.filter((o) => o.status === 'failed'));
  }, []);

  useEffect(() => {
    if (visible) void load();
  }, [load, visible]);

  const notify = useCallback(async () => {
    await refreshPendingOrders();
    await load();
    onChanged?.();
  }, [load, onChanged, refreshPendingOrders]);

  const retryOne = async (order: OfflinePosOrderRecord) => {
    if (!isOnline || busy) return;
    setBusy(true);
    try {
      await retryFailedOrders(new Set([order.client_order_id]));
      await syncAll();
      await notify();
      toast.success(t('header.retry'));
    } catch {
      toast.error(t('header.syncFailed', { count: 1 }));
    } finally {
      setBusy(false);
    }
  };

  const dismissOne = async (order: OfflinePosOrderRecord) => {
    const ok = await dialog.confirm({
      title: t('header.dismiss'),
      message: order.local_order_id,
      destructive: true,
      confirmLabel: t('header.dismiss'),
      cancelLabel: t('header.cancel'),
    });
    if (!ok) return;
    setBusy(true);
    try {
      await removePendingOrders(new Set([order.client_order_id]));
      await notify();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} title={t('header.failedPosOrders')} size="form">
      {busy ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} />
        </View>
      ) : null}
      {orders.length === 0 ? (
        <AppText style={[styles.empty, { color: c.textMuted }]}>{t('header.emptyFailedPos')}</AppText>
      ) : (
        orders.map((order) => (
          <View key={order.client_order_id} style={[styles.card, { borderColor: c.borderSubtle }]}>
            <AppText style={[styles.title, { color: c.text }]}>
              {order.local_order_id.slice(0, 8)} • {money(order.totals_snapshot.total)}
            </AppText>
            <AppText style={[styles.meta, { color: c.textMuted }]}>
              {dateText(order.created_at)} • {numberText(order.items.length)}
            </AppText>
            <AppText style={[styles.reason, { color: c.danger }]}>
              {order.error_message ?? '—'}
            </AppText>
            <View style={styles.actions}>
              <AppButton
                title={t('header.retry')}
                size="sm"
                variant="secondary"
                disabled={!isOnline || busy}
                onPress={() => void retryOne(order)}
              />
              <AppButton
                title={t('header.dismiss')}
                size="sm"
                variant="danger"
                disabled={busy}
                onPress={() => void dismissOne(order)}
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
