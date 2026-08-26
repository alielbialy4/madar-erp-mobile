import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { hrAPI, type PayrollRun } from '@/api/hr';
import { ListScreenLayout } from '@/components/layout';
import { AppBanner, useToast } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import type { SelectOption } from '@/components/ui/AppSelect';
import { FinancialRow } from '@/components/madar';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';

const statusLabel = (status: string) =>
  ({ draft: 'مسودة', approved: 'معتمد', partially_paid: 'مدفوع جزئياً', paid: 'مدفوع', cancelled: 'ملغي' })[status] ??
  status;

const statusTone = (status: string): 'success' | 'warning' | 'info' | 'danger' | 'neutral' => {
  if (status === 'paid') return 'success';
  if (status === 'approved') return 'info';
  if (status === 'cancelled') return 'danger';
  if (status === 'draft' || status === 'partially_paid') return 'warning';
  return 'neutral';
};

export function PayrollRunsScreen({ navigation }: { navigation: any }) {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const branches = useBranchStore((state) => state.branches);
  const viewMode = useBranchStore((state) => state.viewMode);
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const canView = hasPermission(user, ['view_payroll', 'manage_payroll']);
  const canManage = hasPermission(user, 'manage_payroll');
  const isBranchView = viewMode === 'branch';

  const now = new Date();
  const [items, setItems] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterBranchId, setFilterBranchId] = useState('');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateBranchId, setGenerateBranchId] = useState('');
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [busy, setBusy] = useState(false);

  const branchOptions = useMemo<SelectOption[]>(
    () => branches.map((b) => ({ label: b.name, value: String(b.id) })),
    [branches],
  );

  useEffect(() => {
    if (isBranchView && activeBranch?.id) {
      setFilterBranchId(String(activeBranch.id));
      setGenerateBranchId(String(activeBranch.id));
    } else if (!isBranchView && !filterBranchId && branches.length > 0) {
      setFilterBranchId(String(branches[0].id));
    }
  }, [isBranchView, activeBranch, branches, filterBranchId]);

  const load = useCallback(
    async (asRefresh = false) => {
      if (!canView) return;
      if (asRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await hrAPI.payroll.list({
          branch_id: filterBranchId || undefined,
          limit: 30,
        });
        setItems(extractArray<PayrollRun>(res));
      } catch (err) {
        setError(normalizeApiError(err).message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [canView, filterBranchId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const generate = async () => {
    const branchForRun = isBranchView ? String(activeBranch?.id ?? '') : generateBranchId;
    if (!branchForRun) return;
    setBusy(true);
    try {
      const res = await hrAPI.payroll.create({
        scope: 'branch',
        branch_id: branchForRun,
        year: Number(year),
        month: Number(month),
      });
      toast.success('تم إنشاء مسير الرواتب');
      setGenerateOpen(false);
      await load();
      if (res.data?.id) navigation.navigate('PayrollRunDetail', { id: res.data.id });
    } catch (err) {
      const message = normalizeApiError(err).message;
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (!canView) {
    return (
      <ListScreenLayout title="مسيرات الرواتب" subtitle="إدارة رواتب العاملين">
        <AppBanner tone="warning" message="تتطلب هذه الشاشة صلاحية عرض أو إدارة الرواتب." />
      </ListScreenLayout>
    );
  }

  return (
    <ListScreenLayout
      title="مسيرات الرواتب"
      subtitle="إنشاء واعتماد وصرف رواتب العاملين الشهرية"
      onRefresh={() => void load(true)}
      refreshing={refreshing}
      fab={canManage ? { label: 'مسير جديد', icon: 'add', onPress: () => setGenerateOpen(true) } : undefined}
      hero={{
        eyebrow: 'الموارد البشرية',
        title: 'الرواتب',
        subtitle: 'مسيرات شهرية لكل فرع',
        stats: [{ label: 'المعروض', value: items.length }],
        compact: true,
      }}
      filters={
        <>
          {!isBranchView ? (
            <AppSelect label="الفرع" value={filterBranchId} options={branchOptions} onChange={setFilterBranchId} />
          ) : null}
          <AppButton title="تحديث" variant="outline" onPress={() => void load(true)} loading={loading} />
        </>
      }
    >
      {error ? <AppBanner tone="danger" message={error} /> : null}

      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={() => void load(true)}
        emptyTitle="لا توجد مسيرات رواتب"
        emptyCtaLabel={canManage ? 'مسير جديد' : undefined}
        onEmptyCta={canManage ? () => setGenerateOpen(true) : undefined}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <FinancialRow
            primary={`${item.year}-${String(item.month).padStart(2, '0')}`}
            secondary={item.branch?.name ?? 'فرع'}
            amount={Number(item.total_net ?? 0)}
            currency="ج.م"
            status={<AppBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />}
            onPress={() => navigation.navigate('PayrollRunDetail', { id: item.id })}
          />
        )}
      />

      <Modal visible={generateOpen} animationType="slide" onRequestClose={() => setGenerateOpen(false)}>
        <View style={styles.modalRoot}>
          <AppBanner tone="info" message="سيتم تجميع الحضور والتسويات وعمولات الشهر في مسير رواتب للفرع المحدد." />
          {!isBranchView ? (
            <AppSelect
              label="الفرع"
              value={generateBranchId}
              options={branchOptions}
              onChange={setGenerateBranchId}
              required
            />
          ) : null}
          <AppInput label="السنة" value={year} onChangeText={setYear} keyboardType="number-pad" required />
          <AppInput label="الشهر (1-12)" value={month} onChangeText={setMonth} keyboardType="number-pad" required />
          <View style={styles.modalFooter}>
            <AppButton title="إغلاق" variant="outline" onPress={() => setGenerateOpen(false)} disabled={busy} />
            <AppButton
              title="إنشاء المسير"
              onPress={() => void generate()}
              disabled={busy || !(isBranchView ? activeBranch?.id : generateBranchId)}
              loading={busy}
            />
          </View>
        </View>
      </Modal>
    </ListScreenLayout>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, gap: 12, padding: 16 },
  modalFooter: { flexDirection: 'row-reverse', gap: 12, paddingTop: 8 },
});
