import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { deliveriesAPI } from '@/api/deliveries';
import { driversAPI } from '@/api/drivers';
import { AppScreen } from '@/components/layout';
import { ConfirmDialog, AppErrorState, AppLoadingState } from '@/components/feedback';
import { AppBadge, AppButton, AppCard, AppListItem, AppSectionHeader, AppSelect } from '@/components/ui';
import { DELIVERY_NEXT_STATUS, deliveryStatusLabel, deliveryStatusTone } from '@/utils/deliveryStatus';
import { extractArray, extractData } from '@/utils/data';
import { asText, dateText, money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';

export function DeliveryDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = String(route.params?.id ?? '');
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null);
  const [drivers, setDrivers] = useState<{ label: string; value: string }[]>([]);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ value: string; label: string } | null>(null);
  const [assignConfirm, setAssignConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailRes, driversRes] = await Promise.all([
        deliveriesAPI.getById(id),
        driversAPI.getActive({ per_page: 100 }),
      ]);
      setDoc(extractData(detailRes) as Record<string, unknown> | null);
      const list = extractArray<Record<string, unknown>>(driversRes);
      setDrivers(list.map((d) => ({ label: String(d.name), value: String(d.id) })));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const status = String(doc?.status ?? '');
  const next = DELIVERY_NEXT_STATUS[status] ?? [];

  const applyStatus = async () => {
    if (!pendingStatus) return;
    setBusy(true);
    try {
      await deliveriesAPI.updateStatus(id, pendingStatus.value);
      setPendingStatus(null);
      await load();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const assign = async () => {
    if (!driverId) return;
    setBusy(true);
    try {
      await deliveriesAPI.assignDriver(id, driverId);
      setAssignConfirm(false);
      await load();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen title={`توصيل ${id}`} onBack={navigation.goBack} onRefresh={() => void load()} refreshing={loading}>
      {loading && !doc ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      {doc ? (
        <View style={{ gap: spacing.md }}>
          <AppCard>
            <AppSectionHeader title="التفاصيل" />
            <AppListItem title="الحالة" badge={<AppBadge label={deliveryStatusLabel(status)} tone={deliveryStatusTone(status)} />} />
            <AppListItem title="التاريخ" subtitle={dateText(asText(doc.created_at, ''))} />
            <AppListItem title="العميل" subtitle={asText((doc.customer as Record<string, unknown>)?.name, '—')} />
            <AppListItem title="السائق" subtitle={asText((doc.driver as Record<string, unknown>)?.name, 'بدون سائق')} />
            <AppListItem title="رسوم التوصيل" meta={money(doc.delivery_fee ?? 0)} />
          </AppCard>
          {status === 'pending' ? (
            <AppCard>
              <AppSectionHeader title="تعيين سائق" />
              <AppSelect label="السائق" value={driverId} options={[{ label: 'اختر', value: '' }, ...drivers]} onChange={setDriverId} />
              <AppButton title="تعيين" onPress={() => setAssignConfirm(true)} disabled={!driverId} />
            </AppCard>
          ) : null}
          {next.length > 0 ? (
            <AppCard>
              <AppSectionHeader title="تغيير الحالة" />
              {next.map((n) => (
                <AppButton key={n.value} title={n.label} variant="secondary" onPress={() => setPendingStatus(n)} />
              ))}
            </AppCard>
          ) : null}
        </View>
      ) : null}
      <ConfirmDialog
        visible={pendingStatus !== null}
        title="تأكيد تغيير الحالة"
        message={`الانتقال إلى: ${pendingStatus?.label}`}
        confirmLabel="تأكيد"
        onConfirm={() => void applyStatus()}
        onCancel={() => setPendingStatus(null)}
        loading={busy}
      />
      <ConfirmDialog
        visible={assignConfirm}
        title="تعيين السائق"
        message="تعيين هذا السائق لطلب التوصيل؟"
        confirmLabel="تعيين"
        onConfirm={() => void assign()}
        onCancel={() => setAssignConfirm(false)}
        loading={busy}
      />
    </AppScreen>
  );
}
