import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, View } from 'react-native';
import { deliveriesAPI } from '@/api/deliveries';
import { driversAPI } from '@/api/drivers';
import { AppScreen } from '@/components/layout';
import { RtlModalRoot } from '@/components/layout/RtlModalRoot';
import { ConfirmDialog, AppErrorState, AppLoadingState } from '@/components/feedback';
import { AppBadge, AppButton, AppCard, AppInput, AppListItem, AppSectionHeader, AppSelect } from '@/components/ui';
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
  const [codModalOpen, setCodModalOpen] = useState(false);
  const [collectedAmount, setCollectedAmount] = useState('');

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

  const isDriverCod = useMemo(() => {
    if (!doc) return false;
    return String(doc.collection_method ?? '') === 'driver' && Number(doc.amount_to_collect ?? 0) > 0;
  }, [doc]);

  const expectedCollect = useMemo(() => Number(doc?.amount_to_collect ?? 0), [doc]);

  const applyStatus = async (payload?: {
    collected_amount?: number;
    collection_note?: string;
    partial_collection_waiver?: boolean;
  }) => {
    if (!pendingStatus) return;
    setBusy(true);
    try {
      await deliveriesAPI.updateStatus(id, {
        status: pendingStatus.value,
        ...payload,
      });
      setPendingStatus(null);
      setCodModalOpen(false);
      setCollectedAmount('');
      await load();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const handleStatusPress = (n: { value: string; label: string }) => {
    if (n.value === 'delivered' && isDriverCod) {
      setPendingStatus(n);
      setCollectedAmount(expectedCollect > 0 ? String(expectedCollect) : '');
      setCodModalOpen(true);
      return;
    }
    setPendingStatus(n);
  };

  const confirmCodCollection = async () => {
    const parsed = parseFloat(collectedAmount);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError('أدخل مبلغاً صالحاً');
      return;
    }
    if (expectedCollect > 0 && parsed > expectedCollect + 0.0001) {
      setError('المبلغ المحصّل لا يمكن أن يتجاوز المطلوب');
      return;
    }
    await applyStatus({ collected_amount: parsed });
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
            {isDriverCod ? (
              <>
                <AppListItem title="تحصيل مع المندوب" meta={money(doc.amount_to_collect ?? 0)} />
                {doc.collection_status ? (
                  <AppListItem title="حالة التحصيل" subtitle={asText(doc.collection_status, '—')} />
                ) : null}
                {doc.collected_amount != null ? (
                  <AppListItem title="المبلغ المحصّل" meta={money(doc.collected_amount)} />
                ) : null}
              </>
            ) : null}
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
                <AppButton key={n.value} title={n.label} variant="secondary" onPress={() => handleStatusPress(n)} />
              ))}
            </AppCard>
          ) : null}
        </View>
      ) : null}
      <ConfirmDialog
        visible={pendingStatus !== null && !codModalOpen}
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
      <Modal visible={codModalOpen} transparent animationType="fade" onRequestClose={() => setCodModalOpen(false)}>
        <RtlModalRoot>
          <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <AppCard>
              <AppSectionHeader title="تأكيد التسليم والتحصيل" />
              <AppListItem title="المبلغ المطلوب" meta={money(expectedCollect)} />
              <AppInput
                label="المبلغ المحصّل"
                value={collectedAmount}
                onChangeText={setCollectedAmount}
                keyboardType="decimal-pad"
              />
              <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                <AppButton title="تأكيد التسليم" onPress={() => void confirmCodCollection()} loading={busy} />
                <AppButton
                  title="إلغاء"
                  variant="secondary"
                  onPress={() => {
                    setCodModalOpen(false);
                    setPendingStatus(null);
                    setCollectedAmount('');
                  }}
                />
              </View>
            </AppCard>
          </View>
        </RtlModalRoot>
      </Modal>
    </AppScreen>
  );
}
