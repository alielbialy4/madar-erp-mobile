import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { budgetsAPI, type Budget, type BudgetScope, type BudgetStatus } from '@/api/budgets';
import { ListScreenLayout } from '@/components/layout';
import { AppBanner, ConfirmDialog, useToast } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
import { AppButton, AppInput, AppSelect, AppSwipeRow } from '@/components/ui';
import { AppBadge } from '@/components/ui/AppBadge';
import { FinancialRow } from '@/components/madar';
import type { SelectOption } from '@/components/ui/AppSelect';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';

const statusOptions: SelectOption[] = [
  { label: 'كل الحالات', value: 'all' },
  { label: 'مسودة', value: 'draft' },
  { label: 'نشط', value: 'active' },
  { label: 'مغلق', value: 'closed' },
];
const scopeOptions: SelectOption[] = [
  { label: 'كل النطاقات', value: 'all' },
  { label: 'الشركة', value: 'company' },
  { label: 'فرع', value: 'branch' },
];

type PendingAction = { type: 'activate' | 'close' | 'delete'; budget: Budget } | null;
const money = (value: unknown) => Number(value ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const statusLabel = (status: BudgetStatus) => ({ draft: 'مسودة', active: 'نشط', closed: 'مغلق' })[status];
const statusTone = (status: BudgetStatus): 'default' | 'success' | 'warning' => status === 'active' ? 'success' : status === 'closed' ? 'default' : 'warning';

export function BudgetsScreen({ navigation }: { navigation: any }) {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const branches = useBranchStore((state) => state.branches);
  const canView = hasPermission(user, ['view_budgets', 'manage_budgets']);
  const canManage = hasPermission(user, 'manage_budgets');
  const [items, setItems] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [status, setStatus] = useState<'all' | BudgetStatus>('all');
  const [scope, setScope] = useState<'all' | BudgetScope>('all');
  const [branchId, setBranchId] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

  const branchOptions = useMemo<SelectOption[]>(() => [
    { label: 'كل الفروع', value: '' },
    ...branches.map((branch) => ({ label: branch.name, value: String(branch.id) })),
  ], [branches]);

  const load = useCallback(async (targetPage = 1, append = false, asRefresh = false) => {
    if (!canView) return;
    if (asRefresh) setRefreshing(true);
    else if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await budgetsAPI.list({
        page: targetPage,
        per_page: 20,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(year.trim() ? { year: Number(year) } : {}),
        ...(status !== 'all' ? { status } : {}),
        ...(scope !== 'all' ? { scope } : {}),
        ...(branchId ? { branch_id: branchId } : {}),
      });
      const rows = extractArray<Budget>(response);
      const meta = response as unknown as { meta?: { current_page?: number; last_page?: number } };
      setItems((previous) => append ? [...previous, ...rows.filter((row) => !previous.some((current) => current.id === row.id))] : rows);
      setPage(meta.meta?.current_page ?? targetPage);
      setLastPage(meta.meta?.last_page ?? targetPage);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [branchId, canView, scope, search, status, year]);

  useEffect(() => {
    void load(1);
  }, [load]);

  const clearFilters = () => {
    setSearch('');
    setYear(String(new Date().getFullYear()));
    setStatus('all');
    setScope('all');
    setBranchId('');
  };

  const runPending = async () => {
    if (!pending || !canManage) return;
    setBusy(true);
    try {
      if (pending.type === 'activate') await budgetsAPI.activate(pending.budget.id);
      if (pending.type === 'close') await budgetsAPI.close(pending.budget.id);
      if (pending.type === 'delete') await budgetsAPI.remove(pending.budget.id);
      toast.success(pending.type === 'activate' ? 'تم تفعيل الموازنة' : pending.type === 'close' ? 'تم إغلاق الموازنة' : 'تم حذف الموازنة');
      setPending(null);
      await load(1);
    } catch (err) {
      const message = normalizeApiError(err).message;
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const cloneBudget = async (budget: Budget) => {
    if (!canManage) return;
    setBusy(true);
    try {
      const response = await budgetsAPI.clone(budget.id, budget.year + 1);
      const cloned = response.data;
      toast.success('تم نسخ الموازنة للسنة التالية');
      await load(1);
      if (cloned?.id) navigation.navigate('BudgetForm', { id: String(cloned.id) });
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
      <ListScreenLayout title="الموازنات" subtitle="إدارة ومتابعة الموازنات">
        <AppBanner tone="warning" message="تتطلب هذه الشاشة صلاحية عرض الموازنات أو إدارتها." />
      </ListScreenLayout>
    );
  }

  const pendingTitle = pending?.type === 'activate' ? 'تفعيل الموازنة' : pending?.type === 'close' ? 'إغلاق الموازنة' : 'حذف الموازنة';
  const pendingMessage = pending?.type === 'activate'
    ? 'سيتم اعتماد هذه الموازنة للاستخدام التشغيلي.'
    : pending?.type === 'close'
      ? 'سيتم منع تعديل خطوط هذه الموازنة بعد الإغلاق.'
      : 'لا يمكن التراجع عن حذف الموازنة.';

  return (
    <ListScreenLayout
      title="الموازنات"
      subtitle={canManage ? 'إنشاء وإدارة موازنات الشركة والفروع' : 'عرض الموازنات المعتمدة'}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="بحث باسم الموازنة…"
      onRefresh={() => void load(1, false, true)}
      refreshing={refreshing}
      fab={canManage ? { label: 'موازنة جديدة', icon: 'add', onPress: () => navigation.navigate('BudgetForm', {}) } : undefined}
      hero={{ eyebrow: 'التخطيط المالي', title: 'الموازنات', subtitle: 'خطط سنوية حسب الشركة أو الفرع', stats: [{ label: 'المعروض', value: items.length }], compact: true }}
      filters={
        <>
          <AppInput label="السنة" value={year} onChangeText={setYear} keyboardType="numeric" />
          <AppSelect label="الحالة" value={status} options={statusOptions} onChange={(value) => setStatus(value as typeof status)} />
          <AppSelect label="النطاق" value={scope} options={scopeOptions} onChange={(value) => setScope(value as typeof scope)} />
          <AppSelect label="الفرع" value={branchId} options={branchOptions} onChange={setBranchId} />
          <AppButton title="إعادة ضبط الفلاتر" variant="outline" onPress={clearFilters} />
        </>
      }
    >
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={() => void load(1, false, true)}
        onEndReached={() => {
          if (!loadingMore && page < lastPage) void load(page + 1, true);
        }}
        emptyTitle="لا توجد موازنات مطابقة"
        emptyCtaLabel={canManage ? 'موازنة جديدة' : undefined}
        onEmptyCta={canManage ? () => navigation.navigate('BudgetForm', {}) : undefined}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const card = (
            <FinancialRow
              primary={item.name}
              secondary={`${item.year} · ${item.scope === 'company' ? 'الشركة' : item.branch?.name || 'فرع'}`}
              meta={item.notes || undefined}
              amount={Number(item.annual_total ?? 0)}
              currency="ج.م"
              status={<AppBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />}
              onPress={() => navigation.navigate('BudgetForm', { id: item.id })}
            />
          );
          if (!canManage) return card;
          return (
            <AppSwipeRow
              rightActions={[
                { label: 'تعديل', icon: 'edit', onPress: () => navigation.navigate('BudgetForm', { id: item.id }) },
                ...(item.status !== 'active' ? [{ label: 'تفعيل', icon: 'check-circle' as const, onPress: () => setPending({ type: 'activate', budget: item }) }] : []),
                ...(item.status === 'active' ? [{ label: 'إغلاق', icon: 'lock' as const, onPress: () => setPending({ type: 'close', budget: item }) }] : []),
                ...(item.status !== 'active' ? [{ label: 'حذف', icon: 'delete' as const, tone: 'danger' as const, onPress: () => setPending({ type: 'delete', budget: item }) }] : []),
              ]}
              leftActions={[{ label: 'نسخ', icon: 'content-copy', onPress: () => void cloneBudget(item) }]}
            >
              {card}
            </AppSwipeRow>
          );
        }}
      />
      <ConfirmDialog
        visible={Boolean(pending)}
        title={pendingTitle}
        message={pendingMessage}
        confirmLabel={pending?.type === 'delete' ? 'حذف' : 'تأكيد'}
        variant={pending?.type === 'delete' ? 'danger' : 'primary'}
        loading={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => void runPending()}
      />
    </ListScreenLayout>
  );
}
