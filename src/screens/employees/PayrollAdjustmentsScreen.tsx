import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { hrAPI, type AdjustmentType, type HrEmployee, type PayrollAdjustment } from '@/api/hr';
import { ListScreenLayout } from '@/components/layout';
import { AppBanner, ConfirmDialog, useToast } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppButton, AppDatePicker, AppInput, AppSelect, AppText as Text } from '@/components/ui';
import type { SelectOption } from '@/components/ui/AppSelect';
import { FinancialRow } from '@/components/madar';
import { AppSwipeRow } from '@/components/ui/AppSwipeRow';
import { useAuthStore } from '@/store/authStore';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';

const todayLocalDateString = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const money = (value: unknown) =>
  Number(value ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusLabel = (status: string) =>
  ({ pending: 'معلق', applied: 'مطبق', approved: 'معتمد', cancelled: 'ملغي' })[status] ?? status;

const statusTone = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
  if (status === 'applied' || status === 'approved') return 'success';
  if (status === 'cancelled') return 'danger';
  if (status === 'pending') return 'warning';
  return 'neutral';
};

const typeOptions: SelectOption[] = [
  { label: 'حافز', value: 'incentive' },
  { label: 'خصم', value: 'penalty' },
];

type PendingCancel = { adjustment: PayrollAdjustment } | null;

export function PayrollAdjustmentsScreen() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const canManage = hasPermission(user, 'manage_payroll_adjustments');

  const [items, setItems] = useState<PayrollAdjustment[]>([]);
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [type, setType] = useState<AdjustmentType>('incentive');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(todayLocalDateString());
  const [saving, setSaving] = useState(false);

  const [pendingCancel, setPendingCancel] = useState<PendingCancel>(null);
  const [busy, setBusy] = useState(false);

  const employeeOptions = useMemo<SelectOption[]>(
    () => employees.map((e) => ({ label: e.name, value: String(e.id) })),
    [employees],
  );

  const load = useCallback(
    async (asRefresh = false) => {
      if (!canManage) return;
      if (asRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [adjRes, empRes] = await Promise.all([
          hrAPI.adjustments.list({ limit: 50 }),
          hrAPI.employees.list({ limit: 100 }),
        ]);
        setItems(extractArray<PayrollAdjustment>(adjRes));
        setEmployees(extractArray<HrEmployee>(empRes));
      } catch (err) {
        const message = normalizeApiError(err).message;
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [canManage],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const resetCreateForm = useCallback(() => {
    setUserId('');
    setType('incentive');
    setAmount('');
    setReason('');
    setEffectiveDate(todayLocalDateString());
  }, []);

  const create = async () => {
    if (!userId || !amount) return;
    setSaving(true);
    try {
      await hrAPI.adjustments.create({
        user_id: Number(userId),
        type,
        amount: Number(amount),
        reason,
        effective_date: effectiveDate,
        category: type === 'incentive' ? 'bonus' : 'other',
      });
      toast.success('تم إضافة التسوية بنجاح');
      resetCreateForm();
      setCreateOpen(false);
      await load();
    } catch (err) {
      const message = normalizeApiError(err).message;
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const cancelAdjustment = async () => {
    if (!pendingCancel) return;
    setBusy(true);
    try {
      await hrAPI.adjustments.cancel(pendingCancel.adjustment.id);
      toast.success('تم إلغاء التسوية');
      setPendingCancel(null);
      await load();
    } catch (err) {
      const message = normalizeApiError(err).message;
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (!canManage) {
    return (
      <ListScreenLayout title="تسويات الرواتب" subtitle="الحوافز والخصومات">
        <AppBanner tone="warning" message="تتطلب هذه الشاشة صلاحية إدارة تسويات الرواتب." />
      </ListScreenLayout>
    );
  }

  return (
    <ListScreenLayout
      title="تسويات الرواتب"
      subtitle="إضافة الحوافز والخصومات على رواتب العاملين"
      onRefresh={() => void load(true)}
      refreshing={refreshing}
      fab={{ label: 'تسوية جديدة', icon: 'add', onPress: () => setCreateOpen(true) }}
      hero={{
        eyebrow: 'الموارد البشرية',
        title: 'التسويات',
        subtitle: 'حافز أو خصم يُطبق على مسير الرواتب',
        stats: [{ label: 'المعروض', value: items.length }],
        compact: true,
      }}
    >
      {error ? <AppBanner tone="danger" message={error} /> : null}

      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={() => void load(true)}
        emptyTitle="لا توجد تسويات مسجلة"
        emptyCtaLabel="تسوية جديدة"
        onEmptyCta={() => setCreateOpen(true)}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AppSwipeRow
            rightActions={[
              ...(item.status === 'pending'
                ? [
                    {
                      label: 'إلغاء',
                      icon: 'close' as const,
                      tone: 'danger' as const,
                      onPress: () => setPendingCancel({ adjustment: item }),
                    },
                  ]
                : []),
            ]}
          >
            <FinancialRow
              primary={item.user?.name ?? `#${item.user_id ?? '—'}`}
              secondary={`${item.type === 'incentive' ? 'حافز' : 'خصم'} · ${String(item.effective_date).slice(0, 10)}${item.reason ? ` · ${item.reason}` : ''}`}
              meta={money(item.amount)}
              amount={item.type === 'incentive' ? Number(item.amount ?? 0) : -Number(item.amount ?? 0)}
              currency="ج.م"
              amountTone={item.type === 'incentive' ? 'positive' : 'negative'}
              status={<AppBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />}
            />
          </AppSwipeRow>
        )}
      />

      <Modal visible={createOpen} animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalRoot}>
          <Text style={styles.modalTitle}>تسوية جديدة</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalBody}>
            <AppSelect
              label="العامل"
              value={userId}
              options={employeeOptions}
              onChange={setUserId}
              required
            />
            <AppSelect label="النوع" value={type} options={typeOptions} onChange={(v) => setType((v as AdjustmentType) || 'incentive')} />
            <AppInput
              label="المبلغ"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              required
              placeholder="0.00"
            />
            <AppDatePicker label="تاريخ السريان" value={effectiveDate} onChange={setEffectiveDate} required />
            <AppInput label="السبب" value={reason} onChangeText={setReason} placeholder="سبب الحافز أو الخصم" multiline />
            {error ? <AppBanner tone="danger" message={error} /> : null}
          </ScrollView>
          <View style={styles.modalFooter}>
            <AppButton title="إغلاق" variant="outline" onPress={() => setCreateOpen(false)} disabled={saving} />
            <AppButton
              title="إضافة"
              onPress={() => void create()}
              disabled={saving || !userId || !Number(amount)}
              loading={saving}
            />
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={Boolean(pendingCancel)}
        title="إلغاء التسوية"
        message="سيتم إلغاء هذه التسوية ولن تُطبق على مسير الرواتب."
        confirmLabel="إلغاء التسوية"
        variant="danger"
        loading={busy}
        onCancel={() => setPendingCancel(null)}
        onConfirm={() => void cancelAdjustment()}
      />
    </ListScreenLayout>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, gap: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', paddingVertical: 8 },
  modalBody: { gap: 12, flexGrow: 1 },
  modalFooter: { flexDirection: 'row-reverse', gap: 12, paddingTop: 8 },
});
