import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { deliveriesAPI } from '@/api/deliveries';
import { driversAPI } from '@/api/drivers';
import { AppBottomSheet, DetailScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms/FormSection';
import { AppBanner, ConfirmDialog } from '@/components/feedback';
import { AppBadge, AppButton, AppInput, AppListItem, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { DELIVERY_NEXT_STATUS, deliveryStatusLabel, deliveryStatusTone } from '@/utils/deliveryStatus';
import { extractArray } from '@/utils/data';
import { asText, dateText, money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { usePermissions } from '@/hooks/usePermissions';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { textStart } from '@/constants/layout';
import { typography } from '@/constants/typography';

type DeliveryDocument = Record<string, unknown>;
type PendingStatus = { value: string; label: string } | null;

function nested(record: unknown, key: string): unknown {
  return record && typeof record === 'object' ? (record as Record<string, unknown>)[key] : undefined;
}

function collectionMethodLabel(value: unknown): string {
  if (value === 'driver') return 'تحصيل مع السائق';
  if (value === 'cashier') return 'محصّل عند نقطة البيع';
  return asText(value, '—');
}

function collectionStatusLabel(value: unknown): string {
  switch (String(value ?? '')) {
    case 'pending': return 'بانتظار التحصيل';
    case 'collected': return 'محصّل بالكامل';
    case 'partial_collected': return 'تحصيل جزئي معتمد';
    case 'settled': return 'تمت التسوية';
    default: return asText(value, '—');
  }
}

export function DeliveryDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = String(route.params?.id ?? '');
  const { can } = usePermissions();
  const c = useColors();
  const canManageDrivers = can('manage_drivers');
  const canCollect = can(['delivery_collect', 'manage_deliveries']);
  const canWaivePartial = can('delivery_cod_partial_waiver');

  const [drivers, setDrivers] = useState<{ label: string; value: string }[]>([]);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driversLoading, setDriversLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<PendingStatus>(null);
  const [assignConfirm, setAssignConfirm] = useState(false);
  const [codSheetOpen, setCodSheetOpen] = useState(false);
  const [collectedAmount, setCollectedAmount] = useState('');
  const [collectionNote, setCollectionNote] = useState('');

  const styles = useMemo(() => StyleSheet.create({
    actionGroup: { gap: spacing.sm },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    actionButton: { flexGrow: 1, minWidth: 150 },
    statusBand: {
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      gap: spacing.sm,
    },
    hint: { ...textStart, color: c.textMuted, fontSize: typography.small, lineHeight: 21 },
  }), [c]);

  const loader = useCallback(() => deliveriesAPI.getById(id) as never, [id]);

  useEffect(() => {
    if (!canManageDrivers) return;
    let active = true;
    setDriversLoading(true);
    void driversAPI.getActive({ per_page: 100 })
      .then((response) => {
        if (!active) return;
        const list = extractArray<Record<string, unknown>>(response);
        setDrivers(list.map((driver) => ({ label: asText(driver.name, 'سائق'), value: String(driver.id) })));
      })
      .catch(() => {
        if (active) setDrivers([]);
      })
      .finally(() => {
        if (active) setDriversLoading(false);
      });
    return () => { active = false; };
  }, [canManageDrivers]);

  const resetCodSheet = () => {
    setCodSheetOpen(false);
    setPendingStatus(null);
    setCollectedAmount('');
    setCollectionNote('');
  };

  const applyStatus = async (
    refresh: () => void,
    payload?: { collected_amount?: number; collection_note?: string; partial_collection_waiver?: boolean },
  ) => {
    if (!pendingStatus) return;
    setBusy(true);
    setNotice(null);
    try {
      await deliveriesAPI.updateStatus(id, { status: pendingStatus.value, ...payload });
      resetCodSheet();
      refresh();
    } catch (err) {
      setNotice(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const openStatus = (doc: DeliveryDocument, nextStatus: Exclude<PendingStatus, null>) => {
    const isDriverCod = String(doc.collection_method ?? '') === 'driver' && Number(doc.amount_to_collect ?? 0) > 0;
    if (nextStatus.value === 'delivered' && isDriverCod) {
      if (!canCollect) {
        setNotice('لا تملك صلاحية تحصيل مبالغ التوصيل. يلزم delivery_collect أو إدارة التوصيل.');
        return;
      }
      setPendingStatus(nextStatus);
      setCollectedAmount(String(Number(doc.amount_to_collect ?? 0)));
      setCollectionNote('');
      setCodSheetOpen(true);
      return;
    }
    setPendingStatus(nextStatus);
  };

  const confirmCodCollection = async (refresh: () => void, expected: number) => {
    const parsed = Number(collectedAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setNotice('أدخل مبلغًا محصّلًا أكبر من صفر.');
      return;
    }
    if (parsed > expected + 0.0001) {
      setNotice('المبلغ المحصّل لا يمكن أن يتجاوز المبلغ المطلوب.');
      return;
    }
    const isPartial = parsed + 0.0001 < expected;
    if (isPartial && !canWaivePartial) {
      setNotice('التحصيل الجزئي يحتاج صلاحية اعتماد فرق التحصيل.');
      return;
    }
    if (isPartial && collectionNote.trim().length < 10) {
      setNotice('اكتب سببًا واضحًا للتحصيل الجزئي لا يقل عن 10 أحرف.');
      return;
    }
    await applyStatus(refresh, {
      collected_amount: parsed,
      ...(collectionNote.trim() ? { collection_note: collectionNote.trim() } : {}),
      ...(isPartial ? { partial_collection_waiver: true } : {}),
    });
  };

  const assign = async (refresh: () => void) => {
    if (!driverId) return;
    setBusy(true);
    setNotice(null);
    try {
      await deliveriesAPI.assignDriver(id, driverId);
      setAssignConfirm(false);
      setDriverId(null);
      refresh();
    } catch (err) {
      setNotice(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DetailScreenLayout<DeliveryDocument>
      title="تفاصيل التوصيل"
      onBack={navigation.goBack}
      loader={loader}
      badge={(doc) => ({
        label: deliveryStatusLabel(String(doc.status ?? '')),
        tone: deliveryStatusTone(String(doc.status ?? '')),
      })}
      heroTitle={(doc) => `فاتورة ${asText(nested(doc.sale, 'invoice_number') ?? doc.sale_id ?? id)}`}
      heroAmount={(doc) => money(nested(doc.sale, 'total') ?? doc.amount_to_collect ?? 0)}
      sections={[
        {
          title: 'العميل والتوصيل',
          fields: [
            { label: 'العميل', value: (doc) => asText(nested(nested(doc.sale, 'customer'), 'name') ?? nested(doc.customer, 'name'), 'بيع مباشر') },
            { label: 'الهاتف', value: (doc) => asText(doc.customer_phone ?? nested(nested(doc.sale, 'customer'), 'phone'), '—'), ltr: true },
            { label: 'العنوان', value: (doc) => asText(doc.delivery_address ?? doc.address, '—') },
            { label: 'المنطقة', value: (doc) => asText(nested(doc.delivery_zone, 'name'), '—') },
            { label: 'السائق', value: (doc) => asText(nested(doc.driver, 'name'), 'لم يُعيّن') },
            { label: 'تاريخ الطلب', value: (doc) => dateText(asText(doc.created_at, '')) },
          ],
        },
        {
          title: 'التحصيل المالي',
          fields: [
            { label: 'رسوم التوصيل', value: (doc) => money(doc.delivery_fee ?? 0), ltr: true },
            { label: 'طريقة التحصيل', value: (doc) => collectionMethodLabel(doc.collection_method) },
            { label: 'المطلوب', value: (doc) => money(doc.amount_to_collect ?? 0), ltr: true },
            { label: 'حالة التحصيل', value: (doc) => collectionStatusLabel(doc.collection_status) },
            { label: 'المحصّل', value: (doc) => money(doc.collected_amount ?? 0), ltr: true },
            { label: 'عهدة السائق', value: (doc) => money(doc.amount_due_from_driver ?? 0), ltr: true },
          ],
        },
      ]}
    >
      {(doc, { refresh }) => {
        const status = String(doc.status ?? '');
        const nextStatuses = (DELIVERY_NEXT_STATUS[status] ?? []).filter((item) => item.value !== 'assigned');
        const expectedCollect = Number(doc.amount_to_collect ?? 0);
        const parsedCollection = Number(collectedAmount);
        const isPartialCollection = Number.isFinite(parsedCollection)
          && parsedCollection > 0
          && parsedCollection + 0.0001 < expectedCollect;

        return (
          <>
            {notice ? <AppBanner tone="danger" message={notice} onDismiss={() => setNotice(null)} /> : null}

            <View style={styles.statusBand}>
              <AppListItem
                title="المسار التشغيلي"
                subtitle="نفّذ الخطوة التالية فقط بعد حدوثها فعليًا"
                badge={<AppBadge label={deliveryStatusLabel(status)} tone={deliveryStatusTone(status)} />}
              />
            </View>

            {status === 'pending' ? (
              <FormSection title="تعيين سائق" subtitle="التعيين ينقل الطلب إلى حالة جاهز للاستلام" icon="person-add-alt-1">
                {canManageDrivers ? (
                  <>
                    <AppSelect
                      label="السائق المتاح"
                      value={driverId}
                      options={driversLoading ? [{ label: 'جاري تحميل السائقين...', value: '' }] : drivers}
                      onChange={setDriverId}
                    />
                    {drivers.length === 0 && !driversLoading ? (
                      <Text style={styles.hint}>لا يوجد سائقون متاحون في هذا النطاق.</Text>
                    ) : null}
                    <AppButton title="تعيين السائق" onPress={() => setAssignConfirm(true)} disabled={!driverId || busy} />
                  </>
                ) : (
                  <AppBanner
                    tone="warning"
                    message="يمكنك متابعة الطلب، لكن قائمة السائقين تتطلب صلاحية إدارة السائقين. الخادم يظل المرجع النهائي للصلاحيات."
                  />
                )}
              </FormSection>
            ) : null}

            {nextStatuses.length > 0 ? (
              <FormSection title="الخطوة التالية" subtitle="كل انتقال يُسجل في خط التتبع" icon="route">
                <View style={styles.actionGrid}>
                  {nextStatuses.map((nextStatus) => {
                    const collectBlocked = nextStatus.value === 'delivered'
                      && String(doc.collection_method ?? '') === 'driver'
                      && expectedCollect > 0
                      && !canCollect;
                    return (
                      <AppButton
                        key={nextStatus.value}
                        title={nextStatus.label}
                        variant={nextStatus.value === 'failed' ? 'dangerGhost' : 'secondary'}
                        onPress={() => openStatus(doc, nextStatus)}
                        disabled={busy || collectBlocked}
                        style={styles.actionButton}
                      />
                    );
                  })}
                </View>
                {nextStatuses.some((item) => item.value === 'delivered')
                  && String(doc.collection_method ?? '') === 'driver'
                  && expectedCollect > 0 ? (
                    <AppBanner
                      tone={canCollect ? 'info' : 'warning'}
                      message={canCollect
                        ? 'تأكيد التسليم سيطلب قيمة التحصيل ويضيف المبلغ المعتمد إلى عهدة السائق.'
                        : 'تأكيد التسليم والتحصيل غير متاح بدون صلاحية تحصيل التوصيل.'}
                    />
                  ) : null}
              </FormSection>
            ) : null}

            <ConfirmDialog
              visible={pendingStatus !== null && !codSheetOpen}
              title="تأكيد تغيير الحالة"
              message={`سيتم نقل الطلب إلى «${pendingStatus?.label ?? ''}» وتسجيل وقت الانتقال.`}
              confirmLabel="تأكيد الانتقال"
              onConfirm={() => void applyStatus(refresh)}
              onCancel={() => setPendingStatus(null)}
              loading={busy}
            />

            <ConfirmDialog
              visible={assignConfirm}
              title="تعيين السائق"
              message={`سيُسند الطلب إلى ${drivers.find((driver) => driver.value === driverId)?.label ?? 'السائق المحدد'}.`}
              confirmLabel="تعيين"
              onConfirm={() => void assign(refresh)}
              onCancel={() => setAssignConfirm(false)}
              loading={busy}
            />

            <AppBottomSheet
              visible={codSheetOpen}
              onClose={resetCodSheet}
              title="تأكيد التسليم والتحصيل"
              subtitle="راجع المبلغ قبل إغلاق الطلب"
              size="form"
            >
              <AppListItem title="المبلغ المطلوب" meta={money(expectedCollect)} />
              <AppInput
                label="المبلغ المحصّل"
                value={collectedAmount}
                onChangeText={setCollectedAmount}
                keyboardType="decimal-pad"
              />
              {isPartialCollection ? (
                <>
                  <AppBanner
                    tone={canWaivePartial ? 'warning' : 'danger'}
                    message={canWaivePartial
                      ? `يوجد فرق ${money(Math.max(0, expectedCollect - parsedCollection))}. يلزم سبب إداري واضح قبل الاعتماد.`
                      : 'لا تملك صلاحية اعتماد تحصيل جزئي.'}
                  />
                  <AppInput
                    label="سبب فرق التحصيل"
                    value={collectionNote}
                    onChangeText={setCollectionNote}
                    multiline
                    placeholder="سبب لا يقل عن 10 أحرف"
                  />
                </>
              ) : (
                <AppInput
                  label="ملاحظة التحصيل"
                  value={collectionNote}
                  onChangeText={setCollectionNote}
                  multiline
                  placeholder="اختياري"
                />
              )}
              <AppBanner
                tone="info"
                icon="account-balance-wallet"
                message="عند التأكيد يثبت الخادم التحصيل وحالة الدين وعهدة السائق؛ لا تُحسب هذه القيم محليًا."
              />
              <View style={styles.actionGroup}>
                <AppButton
                  title="تأكيد التسليم والتحصيل"
                  onPress={() => void confirmCodCollection(refresh, expectedCollect)}
                  loading={busy}
                  disabled={busy || (isPartialCollection && (!canWaivePartial || collectionNote.trim().length < 10))}
                />
                <AppButton title="رجوع" variant="secondary" onPress={resetCodSheet} disabled={busy} />
              </View>
            </AppBottomSheet>
          </>
        );
      }}
    </DetailScreenLayout>
  );
}
