import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { textStart } from '@/constants/layout';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { syncAll } from '@/services/sync/syncService';
import { countByStatus, getPendingOrders, removePendingOrders, retryFailedOrders } from '@/services/offline/posOrders';
import type { OfflinePosOrderRecord } from '@/types/offline';
import { usePrintStore } from '@/store/printStore';
import { usePosStore } from '@/store/posStore';
import { useNetworkStore } from '@/store/networkStore';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { dateText, money, numberText } from '@/utils/format';

export function SyncStatusScreen() {
  const c = useColors();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearOrderId, setClearOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<OfflinePosOrderRecord[]>([]);
  const [clearing, setClearing] = useState(false);
  const isOnline = useNetworkStore((s) => s.isOnline);
  const refreshPendingOrders = usePosStore((s) => s.refreshPendingOrders);
  const pendingOrders = usePosStore((s) => s.pendingOrders);

  const styles = useMemo(() => StyleSheet.create({
    statText: { color: c.text, fontSize: typography.body, fontWeight: '800', ...textStart },
    resultText: { color: c.info, fontSize: typography.small, ...textStart, fontWeight: '700' },
    actions: { gap: spacing.md },
    failedCard: { gap: spacing.sm, marginTop: spacing.sm, borderWidth: 1, borderColor: c.borderSubtle, borderRadius: 12, padding: spacing.md },
    failedTitle: { color: c.text, fontSize: typography.small, fontWeight: '800', ...textStart },
    failedMeta: { color: c.textMuted, fontSize: typography.tiny, ...textStart },
    failedReason: { color: c.danger, fontSize: typography.small, fontWeight: '700', ...textStart },
    failedActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  }), [c]);

  const printPending = usePrintStore((s) => s.pendingCount);
  const printFailed = usePrintStore((s) => s.failedCount);
  const refreshPrint = usePrintStore((s) => s.refresh);

  const loadPending = useCallback(async () => {
    const orders = await getPendingOrders();
    const counts = countByStatus(orders);
    setOrders(orders);
    setPendingCount(counts.pending);
    setFailedCount(counts.failed);
    await refreshPrint();
  }, [refreshPrint]);

  useEffect(() => {
    void loadPending();
  }, [loadPending, pendingOrders.length]);

  const handleSync = async () => {
    if (!isOnline) {
      setResult('لا يوجد اتصال بالإنترنت');
      return;
    }
    setSyncing(true);
    setResult(null);
    try {
      const res = await syncAll();
      setResult(`تم مزامنة ${numberText(res.pushed)} طلب بنجاح.${res.errors.length > 0 ? ` أخطاء: ${res.errors.join(' | ')}` : ''}`);
      await refreshPendingOrders();
      await loadPending();
    } catch {
      setResult('فشلت المزامنة');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearFailed = async () => {
    setClearing(true);
    try {
      const orders = await getPendingOrders();
      const failedIds = new Set(orders.filter((o) => o.status === 'failed').map((o) => o.client_uuid));
      await removePendingOrders(failedIds);
      await refreshPendingOrders();
      await loadPending();
      setResult(failedIds.size > 0 ? `تم حذف ${numberText(failedIds.size)} طلب فاشل` : 'لا توجد طلبات فاشلة للحذف');
    } finally {
      setClearing(false);
      setClearConfirm(false);
    }
  };

  const handleClearOneFailed = async () => {
    if (!clearOrderId) return;
    setClearing(true);
    try {
      await removePendingOrders(new Set([clearOrderId]));
      await refreshPendingOrders();
      await loadPending();
      setResult('تم حذف الطلب الفاشل بعد التأكيد');
    } finally {
      setClearing(false);
      setClearOrderId(null);
    }
  };

  const handleRetryFailed = async () => {
    if (!isOnline) {
      setResult('لا يوجد اتصال بالإنترنت');
      return;
    }
    setSyncing(true);
    setResult(null);
    try {
      const retried = await retryFailedOrders();
      await refreshPendingOrders();
      await loadPending();
      const res = await syncAll();
      setResult(
        retried > 0
          ? `تمت إعادة محاولة ${numberText(retried)} طلب فاشل. تمت مزامنة ${numberText(res.pushed)} طلب.${res.errors.length > 0 ? ` أخطاء: ${res.errors.join(' | ')}` : ''}`
          : 'لا توجد طلبات فاشلة لإعادة المحاولة',
      );
      await refreshPendingOrders();
      await loadPending();
    } catch {
      setResult('فشلت إعادة المحاولة');
    } finally {
      setSyncing(false);
    }
  };

  const handleRetryOne = async (order: OfflinePosOrderRecord) => {
    if (!isOnline) {
      setResult('لا يوجد اتصال بالإنترنت');
      return;
    }
    setSyncing(true);
    setResult(null);
    try {
      const retried = await retryFailedOrders(new Set([order.client_order_id]));
      await refreshPendingOrders();
      const res = await syncAll();
      setResult(
        retried > 0
          ? `تمت إعادة محاولة الطلب ${order.local_order_id.slice(0, 8)}. تمت مزامنة ${numberText(res.pushed)} طلب.${res.errors.length > 0 ? ` أخطاء: ${res.errors.join(' | ')}` : ''}`
          : 'لا يمكن إعادة محاولة هذا الطلب حالياً',
      );
      await refreshPendingOrders();
      await loadPending();
    } catch {
      setResult('فشلت إعادة المحاولة');
    } finally {
      setSyncing(false);
    }
  };

  const failedOrders = orders.filter((order) => order.status === 'failed');

  return (
    <AppScreen title="حالة المزامنة">
      <AppCard>
        <AppSectionHeader title="نطاق المزامنة الأوفلاين" />
        <Text style={styles.failedMeta}>
          المزامنة المحلية الحالية تغطي مبيعات نقطة البيع والطباعة فقط. تعديل المشتريات أو العملاء أو المصروفات يتطلب اتصالاً مباشراً (مثل الويب).
        </Text>
      </AppCard>
      <AppCard>
        <AppSectionHeader title="حالة الاتصال" />
        <AppListItem
          title="الاتصال"
          subtitle={isOnline ? 'يمكن مزامنة الطلبات المعلقة' : 'المزامنة متوقفة حتى يعود الاتصال'}
          badge={<AppBadge label={isOnline ? 'متصل' : 'غير متصل'} tone={isOnline ? 'success' : 'warning'} />}
        />
      </AppCard>
      <AppCard>
        <AppSectionHeader title="الطلبات المعلقة" />
        <Text style={styles.statText}>طلبات بانتظار المزامنة: {numberText(pendingCount)}</Text>
        <Text style={styles.statText}>طلبات فاشلة: {numberText(failedCount)}</Text>
        <Text style={styles.statText}>طباعة معلقة: {numberText(printPending)}</Text>
        <Text style={styles.statText}>طباعة فاشلة: {numberText(printFailed)}</Text>
      </AppCard>
      <AppCard>
        <AppSectionHeader title="إجراءات" />
        {result ? <Text style={styles.resultText}>{result}</Text> : null}
        <View style={styles.actions}>
          <AppButton title="مزامنة الآن" onPress={handleSync} loading={syncing} disabled={!isOnline} />
          <AppButton title="إعادة محاولة الفاشلة" variant="outline" onPress={handleRetryFailed} loading={syncing} disabled={!isOnline || failedCount === 0} />
          <AppButton title="حذف الطلبات الفاشلة" variant="danger" onPress={() => setClearConfirm(true)} disabled={failedCount === 0} />
        </View>
      </AppCard>
      {failedOrders.length > 0 ? (
        <AppCard>
          <AppSectionHeader title="تفاصيل التعارضات والفشل" />
          {failedOrders.map((order) => (
            <View key={order.client_order_id} style={styles.failedCard}>
              <Text style={styles.failedTitle}>
                طلب محلي {order.local_order_id.slice(0, 8)} • {money(order.totals_snapshot.total)}
              </Text>
              <Text style={styles.failedMeta}>
                {dateText(order.created_at)} • {numberText(order.items.length)} أصناف
              </Text>
              {order.coupon_snapshot ? (
                <Text style={styles.failedMeta}>
                  كوبون بانتظار التحقق: {order.coupon_snapshot.coupon_code ?? order.coupon_snapshot.coupon_id ?? '—'} • خصم {money(order.coupon_snapshot.coupon_discount)}
                </Text>
              ) : null}
              <Text style={styles.failedReason}>
                سبب الخادم: {order.error_message ?? 'لم يرجع الخادم سبباً محدداً.'}
              </Text>
              <View style={styles.failedActions}>
                <AppButton
                  title="إعادة المحاولة"
                  variant="secondary"
                  size="sm"
                  onPress={() => void handleRetryOne(order)}
                  disabled={!isOnline || syncing}
                />
                <AppButton
                  title="حذف هذا الطلب"
                  variant="danger"
                  size="sm"
                  onPress={() => setClearOrderId(order.client_order_id)}
                  disabled={syncing || clearing}
                />
              </View>
            </View>
          ))}
        </AppCard>
      ) : null}
      <ConfirmDialog
        visible={clearConfirm}
        title="حذف الطلبات الفاشلة"
        message="سيتم حذف جميع الطلبات الفاشلة نهائياً. هل أنت متأكد؟"
        confirmLabel="حذف"
        onConfirm={handleClearFailed}
        onCancel={() => setClearConfirm(false)}
        loading={clearing}
      />
      <ConfirmDialog
        visible={clearOrderId !== null}
        title="حذف طلب فاشل"
        message="سيتم حذف هذا الطلب المحلي الفاشل نهائياً. استخدم هذا فقط بعد معالجة سبب الرفض أو إعادة إدخال البيع يدوياً."
        confirmLabel="حذف"
        onConfirm={handleClearOneFailed}
        onCancel={() => setClearOrderId(null)}
        loading={clearing}
      />
    </AppScreen>
  );
}
