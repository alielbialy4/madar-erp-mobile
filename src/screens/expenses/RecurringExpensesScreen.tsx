import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { expensesAPI } from '@/api/expenses';
import { financialAccountsAPI, type PaymentSource } from '@/api/financialAccounts';
import { ListScreenLayout, SheetFormLayout } from '@/components/layout';
import { FormSection, SwitchRow } from '@/components/forms/FormSection';
import { AppBanner, AppErrorState, ConfirmDialog, useToast } from '@/components/feedback';
import { AppAmountInput, AppButton, AppDatePicker, AppDomainCard, AppInput, AppPicker, AppSelect } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { usePermissions } from '@/hooks/usePermissions';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore } from '@/store/networkStore';
import { moduleIcons } from '@/constants/iconMap';
import { spacing } from '@/constants/spacing';
import { extractArray } from '@/utils/data';
import { dateText, money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import type { ExpenseCategory, RecurringExpense, RecurringExpensePage } from '@/types/expenses';
import type { MoreStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<MoreStackParamList, 'RecurringExpenses'>;

type FormState = {
  branch_id: string;
  expense_category_id: string;
  financial_account_id: string;
  title: string;
  description: string;
  amount: string;
  frequency: string;
  start_date: string;
  end_date: string;
  reference_number: string;
  notes: string;
  is_active: boolean;
};

const frequencyOptions = [
  { label: 'يومياً', value: 'daily' },
  { label: 'أسبوعياً', value: 'weekly' },
  { label: 'كل أسبوعين', value: 'biweekly' },
  { label: 'شهرياً', value: 'monthly' },
  { label: 'ربع سنوي', value: 'quarterly' },
  { label: 'سنوياً', value: 'yearly' },
];

function frequencyLabel(value: string): string {
  return frequencyOptions.find((option) => option.value === value)?.label ?? value;
}

function emptyForm(branchId = ''): FormState {
  return {
    branch_id: branchId,
    expense_category_id: '',
    financial_account_id: '',
    title: '',
    description: '',
    amount: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    reference_number: '',
    notes: '',
    is_active: true,
  };
}

export function RecurringExpensesScreen({ navigation }: Props) {
  const toast = useToast();
  const { can } = usePermissions();
  const branches = useBranchStore((state) => state.branches);
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const viewMode = useBranchStore((state) => state.viewMode);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(viewMode === 'branch' ? activeBranch?.id ?? '' : ''));
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringExpense | null>(null);
  const canManage = can(['manage_expenses', 'access_admin_routes']);

  const loader = useCallback(
    () => {
      void reloadVersion;
      return expensesAPI.getRecurring({
        per_page: 100,
        ...(viewMode === 'branch' && activeBranch?.id ? { branch_id: activeBranch.id } : {}),
      });
    },
    [activeBranch?.id, reloadVersion, viewMode],
  );
  const { data: page, loading, refreshing, error: loadError, refresh } = useAsyncResource<RecurringExpensePage>(loader);
  const rows = page?.data ?? [];

  useEffect(() => {
    if (!formOpen) return;
    expensesAPI.getCategories({ is_active: true, ...(form.branch_id ? { branch_id: form.branch_id } : {}) })
      .then((response) => setCategories(extractArray<ExpenseCategory>(response).filter((category) => category.is_active !== false)))
      .catch(() => setCategories([]));
  }, [form.branch_id, formOpen]);

  useEffect(() => {
    setPaymentSources([]);
    if (!formOpen || !form.branch_id) return;
    setSourcesLoading(true);
    financialAccountsAPI.paymentSources({
      operation: 'expense',
      branch_id: form.branch_id,
      ...(form.amount ? { amount: form.amount } : {}),
      include_unavailable: true,
    })
      .then((response) => setPaymentSources((response.data ?? []).filter((source) => source.is_available !== false)))
      .catch(() => setPaymentSources([]))
      .finally(() => setSourcesLoading(false));
  }, [form.amount, form.branch_id, formOpen]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(viewMode === 'branch' ? activeBranch?.id ?? '' : ''));
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (item: RecurringExpense) => {
    setEditing(item);
    setForm({
      branch_id: item.branch_id,
      expense_category_id: String(item.expense_category_id),
      financial_account_id: item.financial_account_id ?? '',
      title: item.title,
      description: item.description ?? '',
      amount: String(item.amount),
      frequency: item.frequency,
      start_date: String(item.start_date ?? '').slice(0, 10),
      end_date: String(item.end_date ?? '').slice(0, 10),
      reference_number: item.reference_number ?? '',
      notes: item.notes ?? '',
      is_active: item.is_active !== false,
    });
    setError(null);
    setFormOpen(true);
  };

  const save = async () => {
    const amount = Number(form.amount);
    if (!form.branch_id) { setError('اختر فرع المصروف المتكرر.'); return; }
    if (!form.expense_category_id) { setError('اختر تصنيف المصروف.'); return; }
    if (!form.title.trim()) { setError('عنوان المصروف مطلوب.'); return; }
    if (!Number.isFinite(amount) || amount <= 0) { setError('أدخل مبلغاً صحيحاً أكبر من صفر.'); return; }
    if (!form.start_date) { setError('تاريخ البداية مطلوب.'); return; }
    if (form.end_date && form.end_date <= form.start_date) { setError('تاريخ النهاية يجب أن يكون بعد تاريخ البداية.'); return; }
    if (!isOnline) { setError('تعديل المصروفات المتكررة يحتاج اتصالاً مباشراً بالخادم.'); return; }

    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await expensesAPI.updateRecurring(editing.id, {
          title: form.title.trim(),
          description: form.description.trim() || null,
          amount,
          frequency: form.frequency,
          start_date: form.start_date,
          end_date: form.end_date || null,
          financial_account_id: form.financial_account_id || null,
          is_active: form.is_active,
          notes: form.notes.trim() || null,
        });
      } else {
        await expensesAPI.createRecurring({
          branch_id: form.branch_id,
          expense_category_id: Number(form.expense_category_id),
          financial_account_id: form.financial_account_id || null,
          title: form.title.trim(),
          description: form.description.trim() || null,
          amount,
          frequency: form.frequency,
          start_date: form.start_date,
          end_date: form.end_date || null,
          reference_number: form.reference_number.trim() || null,
          notes: form.notes.trim() || null,
        });
      }
      toast.success(editing ? 'تم تحديث المصروف المتكرر' : 'تم إنشاء المصروف المتكرر');
      setFormOpen(false);
      setReloadVersion((version) => version + 1);
    } catch (reason) {
      const message = normalizeApiError(reason).message;
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await expensesAPI.deleteRecurring(deleteTarget.id);
      toast.success('تم حذف المصروف المتكرر');
      setDeleteTarget(null);
      setFormOpen(false);
      setReloadVersion((version) => version + 1);
    } catch (reason) {
      const message = normalizeApiError(reason).message;
      setError(message);
      toast.error(message);
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const selectedAccount = paymentSources.find((source) => String(source.id) === form.financial_account_id);
  const paymentOptions = useMemo(() => [
    { label: 'بدون دفع تلقائي — إنشاء كمستحق', value: '' },
    ...paymentSources.map((source) => ({
      label: [source.name, source.masked_identifier].filter(Boolean).join(' · '),
      value: String(source.id),
    })),
  ], [paymentSources]);

  if (!canManage) {
    return (
      <ListScreenLayout title="المصروفات المتكررة" onBack={navigation.goBack}>
        <AppErrorState message="إدارة المصروفات المتكررة تتطلب صلاحية مدير المصروفات." />
      </ListScreenLayout>
    );
  }

  return (
    <>
      <ListScreenLayout
        title="المصروفات المتكررة"
        subtitle="جدولة الالتزام وسياسة الدفع لكل دورة"
        onBack={navigation.goBack}
        onRefresh={refresh}
        refreshing={refreshing}
        hero={{
          eyebrow: 'الأتمتة المالية',
          title: 'الجدول المتكرر',
          subtitle: 'كل استحقاق ينشئ مصروفاً مستقلاً؛ الدفع التلقائي لا يحدث إلا عند اختيار حساب مالي',
          stats: [
            { label: 'الإجمالي', value: page?.total ?? rows.length },
            { label: 'نشط', value: rows.filter((item) => item.is_active !== false).length, tone: 'success' },
            { label: 'دفع تلقائي', value: rows.filter((item) => item.financial_account_id).length },
          ],
          compact: true,
        }}
        fab={{ onPress: openCreate, label: 'مصروف متكرر جديد' }}
      >
        <ResourceList<RecurringExpense>
          data={rows}
          loading={loading}
          refreshing={refreshing}
          error={loadError}
          onRefresh={refresh}
          emptyTitle="لا توجد مصروفات متكررة"
          emptyCtaLabel="إنشاء جدول متكرر"
          onEmptyCta={openCreate}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AppDomainCard
              title={item.title}
              subtitle={`${item.category?.name ?? 'بدون تصنيف'} · ${frequencyLabel(item.frequency)}`}
              meta={[
                item.branch?.name ?? 'فرع محدد',
                `الاستحقاق القادم ${dateText(item.next_date ?? '')}`,
                item.financial_account_id ? item.financialAccount?.name ?? item.financial_account?.name ?? 'دفع تلقائي' : 'يُنشأ كمستحق',
              ].join(' · ')}
              metric={money(item.amount)}
              badgeLabel={item.is_active === false ? 'متوقف' : 'نشط'}
              badgeTone={item.is_active === false ? 'danger' : 'success'}
              leadingIcon={moduleIcons.expenses}
              onPress={() => openEdit(item)}
            />
          )}
        />
      </ListScreenLayout>

      <SheetFormLayout
        visible={formOpen}
        onClose={() => { if (!saving) setFormOpen(false); }}
        title={editing ? 'تعديل المصروف المتكرر' : 'مصروف متكرر جديد'}
      >
        <View style={{ gap: spacing.lg }}>
          {!isOnline ? <AppBanner tone="warning" message="لا يمكن تعديل الجدول المتكرر أثناء عدم الاتصال." /> : null}
          {error ? <AppBanner tone="danger" message={error} /> : null}
          <FormSection title="الجدول والاستحقاق" icon="event-repeat">
            <AppPicker
              label="الفرع"
              value={form.branch_id || null}
              options={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
              onChange={(branch_id) => setForm((current) => ({ ...current, branch_id: branch_id ?? '', expense_category_id: '', financial_account_id: '' }))}
              required
              disabled={Boolean(editing)}
            />
            <AppPicker
              label="التصنيف"
              value={form.expense_category_id || null}
              options={categories.map((category) => ({ label: category.name, value: String(category.id) }))}
              onChange={(expense_category_id) => setForm((current) => ({ ...current, expense_category_id: expense_category_id ?? '' }))}
              required
              disabled={Boolean(editing)}
            />
            <AppInput label="العنوان" value={form.title} onChangeText={(title) => setForm((current) => ({ ...current, title }))} required />
            <AppInput label="الوصف" value={form.description} onChangeText={(description) => setForm((current) => ({ ...current, description }))} multiline />
            <AppAmountInput label="المبلغ لكل دورة" value={form.amount} onChangeText={(amount) => setForm((current) => ({ ...current, amount }))} required />
            <AppSelect
              label="التكرار"
              value={form.frequency}
              options={frequencyOptions}
              onChange={(frequency) => setForm((current) => ({ ...current, frequency }))}
            />
            <AppDatePicker label="تاريخ البداية" value={form.start_date} onChange={(start_date) => setForm((current) => ({ ...current, start_date }))} disabled={Boolean(editing)} />
            <AppDatePicker label="تاريخ النهاية (اختياري)" value={form.end_date} onChange={(end_date) => setForm((current) => ({ ...current, end_date }))} />
            {form.end_date ? (
              <AppButton title="إزالة تاريخ النهاية" variant="ghost" size="sm" onPress={() => setForm((current) => ({ ...current, end_date: '' }))} />
            ) : null}
          </FormSection>

          <FormSection title="سياسة الدفع" subtitle="بدون حساب مالي سيُنشأ كل استحقاق كغير مدفوع" icon="account-balance-wallet">
            <AppPicker
              label="حساب الدفع التلقائي"
              value={form.financial_account_id}
              options={paymentOptions}
              onChange={(financial_account_id) => setForm((current) => ({ ...current, financial_account_id: financial_account_id ?? '' }))}
              placeholder={sourcesLoading ? 'جاري تحميل الحسابات...' : 'اختر سياسة الدفع'}
            />
            {selectedAccount ? (
              <AppBanner tone="warning" message={`كل استحقاق سيخصم تلقائياً من ${selectedAccount.name} بتاريخ الاستحقاق.`} />
            ) : (
              <AppBanner tone="info" message="كل استحقاق سيظهر كمصروف غير مدفوع ويحتاج دفعة لاحقة من شاشة التفاصيل." />
            )}
            {!editing ? <AppInput label="المرجع" value={form.reference_number} onChangeText={(reference_number) => setForm((current) => ({ ...current, reference_number }))} /> : null}
            <AppInput label="ملاحظات" value={form.notes} onChangeText={(notes) => setForm((current) => ({ ...current, notes }))} multiline />
            {editing ? (
              <SwitchRow
                label="الجدول نشط"
                hint="إيقافه يمنع إنشاء استحقاقات جديدة ولا يحذف المصروفات السابقة"
                value={form.is_active}
                onValueChange={(is_active) => setForm((current) => ({ ...current, is_active }))}
              />
            ) : null}
          </FormSection>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <AppButton title={editing ? 'حفظ التعديل' : 'إنشاء الجدول'} onPress={() => void save()} loading={saving} disabled={!isOnline || !form.branch_id || !form.expense_category_id || !form.title.trim() || !form.amount} style={{ flex: 1 }} />
            {editing ? <AppButton title="حذف" variant="dangerGhost" onPress={() => setDeleteTarget(editing)} disabled={saving || !isOnline} /> : null}
          </View>
        </View>
      </SheetFormLayout>

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="حذف الجدول المتكرر"
        message={`سيُحذف جدول «${deleteTarget?.title ?? ''}». المصروفات التي سبق إنشاؤها ستبقى في السجل المالي.`}
        confirmLabel="حذف الجدول"
        loading={saving}
        onConfirm={() => void remove()}
        onCancel={() => { if (!saving) setDeleteTarget(null); }}
      />
    </>
  );
}
