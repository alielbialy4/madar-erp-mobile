import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { budgetsAPI, type Budget, type BudgetScope, type BudgetSection } from '@/api/budgets';
import { FormSection } from '@/components/forms';
import { AppLoadingState, ConfirmDialog, useToast } from '@/components/feedback';
import { FormScreenLayout } from '@/components/layout';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { AppText } from '@/components/ui/AppText';
import type { SelectOption } from '@/components/ui/AppSelect';
import { spacing } from '@/constants/spacing';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useColors } from '@/hooks/useColors';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';
import { BUDGET_MONTHS, budgetGridToLines, budgetGridTotal, linesToBudgetGrid, type BudgetGridRow } from '@/utils/budgets';

const monthLabels = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const monthOptions: SelectOption[] = BUDGET_MONTHS.map((month) => ({ label: monthLabels[month - 1], value: String(month) }));
const scopeOptions: SelectOption[] = [{ label: 'الشركة', value: 'company' }, { label: 'فرع', value: 'branch' }];
const sectionOptions: SelectOption[] = [{ label: 'العمالة', value: 'labor' }, { label: 'المصروفات التشغيلية', value: 'opex' }];
const sectionLabel: Record<BudgetSection, string> = { revenue: 'الإيرادات', cogs: 'تكلفة المبيعات', labor: 'العمالة', opex: 'المصروفات التشغيلية' };

type FormState = { name: string; year: string; scope: BudgetScope; branchId: string; notes: string };
const emptyForm = (): FormState => ({ name: '', year: String(new Date().getFullYear()), scope: 'company', branchId: '', notes: '' });

export function BudgetFormScreen({ navigation, route }: { navigation: any; route: any }) {
  const id = route.params?.id as string | undefined;
  const c = useColors();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const branches = useBranchStore((state) => state.branches);
  const canView = hasPermission(user, ['view_budgets', 'manage_budgets']);
  const canManage = hasPermission(user, 'manage_budgets');
  const [budget, setBudget] = useState<Budget | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [grid, setGrid] = useState<BudgetGridRow[]>([]);
  const [month, setMonth] = useState(1);
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const branchOptions = useMemo<SelectOption[]>(() => branches.map((branch) => ({ label: branch.name, value: String(branch.id) })), [branches]);
  const editable = canManage && budget?.status !== 'closed';

  const hydrate = useCallback((row: Budget) => {
    setBudget(row);
    setForm({ name: row.name, year: String(row.year), scope: row.scope, branchId: row.branch_id || '', notes: row.notes || '' });
    setGrid(linesToBudgetGrid(row.lines || []));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    budgetsAPI.get(id)
      .then((response) => {
        const row = extractData<Budget>(response);
        if (row) hydrate(row);
      })
      .catch((err) => setError(normalizeApiError(err).message))
      .finally(() => setLoading(false));
  }, [hydrate, id]);

  const patch = (value: Partial<FormState>) => setForm((current) => ({ ...current, ...value }));
  const patchLine = (key: string, value: Partial<BudgetGridRow>) => setGrid((rows) => rows.map((row) => row.key === key ? { ...row, ...value } : row));
  const patchAmount = (key: string, value: string) => setGrid((rows) => rows.map((row) => row.key === key ? {
    ...row,
    amounts: { ...row.amounts, [month]: Number.isFinite(Number(value)) ? Number(value) : 0 },
  } : row));

  const save = async () => {
    if (!canManage) {
      setError('ليس لديك صلاحية إدارة الموازنات.');
      return;
    }
    const parsedYear = Number(form.year);
    if (!form.name.trim() || !Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2200) {
      setError('أدخل اسم الموازنة وسنة صحيحة.');
      return;
    }
    if (form.scope === 'branch' && !form.branchId) {
      setError('اختر الفرع للموازنة الفرعية.');
      return;
    }
    if (budget?.status === 'closed') {
      setError('الموازنة المغلقة للعرض فقط.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (budget) {
        const updated = await budgetsAPI.update(budget.id, { name: form.name.trim(), notes: form.notes.trim() || null });
        const lines = await budgetsAPI.updateLines(budget.id, budgetGridToLines(grid));
        hydrate(extractData<Budget>(lines) ?? extractData<Budget>(updated) ?? budget);
        toast.success('تم حفظ الموازنة وخطوطها');
      } else {
        const created = await budgetsAPI.create({
          name: form.name.trim(),
          year: parsedYear,
          scope: form.scope,
          branch_id: form.scope === 'branch' ? form.branchId : null,
          notes: form.notes.trim() || null,
        });
        const row = extractData<Budget>(created);
        if (!row) throw new Error('لم يعِد الخادم الموازنة المنشأة.');
        if (grid.length) {
          const withLines = await budgetsAPI.updateLines(row.id, budgetGridToLines(grid));
          hydrate(extractData<Budget>(withLines) ?? row);
        } else {
          hydrate(row);
        }
        toast.success('تم إنشاء الموازنة');
        navigation.replace('BudgetForm', { id: row.id });
      }
    } catch (err) {
      const message = normalizeApiError(err).message;
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (action: 'seed' | 'sync' | 'clone') => {
    if (!budget || !canManage) return;
    setBusy(true);
    try {
      const response = action === 'seed'
        ? await budgetsAPI.seedFromActuals(budget.id, budget.year - 1)
        : action === 'sync'
          ? await budgetsAPI.syncCategories(budget.id)
          : await budgetsAPI.clone(budget.id, budget.year + 1);
      const row = extractData<Budget>(response);
      if (!row) throw new Error('لم يعِد الخادم بيانات الموازنة.');
      if (action === 'clone') {
        toast.success('تم نسخ الموازنة للسنة التالية');
        navigation.push('BudgetForm', { id: row.id });
      } else {
        hydrate(row);
        toast.success(action === 'seed' ? 'تمت تعبئة الخطوط من بيانات السنة السابقة' : 'تمت مزامنة تصنيفات المصروفات');
      }
    } catch (err) {
      const message = normalizeApiError(err).message;
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!budget || !canManage) return;
    setBusy(true);
    try {
      await budgetsAPI.remove(budget.id);
      toast.success('تم حذف الموازنة');
      navigation.navigate('Budgets');
    } catch (err) {
      const message = normalizeApiError(err).message;
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
      setDeleteVisible(false);
    }
  };

  if (!canView) {
    return <FormScreenLayout title="الموازنة" onBack={navigation.goBack}><AppText>ليس لديك صلاحية عرض الموازنات.</AppText></FormScreenLayout>;
  }
  if (loading) {
    return <FormScreenLayout title="الموازنة" onBack={navigation.goBack}><AppLoadingState variant="skeleton" skeletonRows={6} /></FormScreenLayout>;
  }

  const revenue = budgetGridTotal(grid, 'revenue');
  const expenses = budgetGridTotal(grid) - revenue;
  return (
    <FormScreenLayout
      title={budget ? 'تعديل موازنة' : 'موازنة جديدة'}
      subtitle={budget?.status === 'closed' ? 'الموازنة مغلقة للعرض فقط' : undefined}
      onBack={navigation.goBack}
      onSave={editable || !budget ? () => void save() : undefined}
      saveLabel={budget ? 'حفظ التعديلات' : 'إنشاء الموازنة'}
      saveLoading={busy}
      onDelete={canManage && budget && budget.status !== 'active' ? () => setDeleteVisible(true) : undefined}
      deleteLabel="حذف"
      heroTitle={budget?.name || form.name || 'موازنة'}
      heroSubtitle={budget ? `${budget.year} • ${budget.scope === 'company' ? 'الشركة' : budget.branch?.name || 'فرع'}` : 'إعداد موازنة سنوية'}
      heroAmount={budget ? `الإجمالي: ${Number(budget.annual_total ?? revenue + expenses).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : undefined}
      actions={budget && canManage ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {budget.status !== 'closed' ? <AppButton title="تعبئة من الفعلي" variant="outline" size="sm" loading={busy} onPress={() => void runAction('seed')} /> : null}
          {budget.status !== 'closed' ? <AppButton title="مزامنة التصنيفات" variant="outline" size="sm" loading={busy} onPress={() => void runAction('sync')} /> : null}
          <AppButton title="نسخ للسنة التالية" variant="outline" size="sm" loading={busy} onPress={() => void runAction('clone')} />
        </View>
      ) : undefined}
    >
      {error ? <AppText style={{ color: c.danger }}>{error}</AppText> : null}
      <FormSection title="بيانات الموازنة" subtitle="الحقول مطابقة لطلب إنشاء الموازنة في الويب" icon="account-balance-wallet">
        <AppInput label="اسم الموازنة" value={form.name} onChangeText={(value) => patch({ name: value })} required editable={!budget || editable} />
        <AppInput label="السنة" value={form.year} onChangeText={(value) => patch({ year: value })} keyboardType="numeric" required editable={!budget} />
        <AppSelect label="النطاق" value={form.scope} options={scopeOptions} onChange={(value) => patch({ scope: value as BudgetScope })} />
        {form.scope === 'branch' ? <AppSelect label="الفرع" value={form.branchId} options={branchOptions} onChange={(value) => patch({ branchId: value })} required /> : null}
        <AppInput label="ملاحظات" value={form.notes} onChangeText={(value) => patch({ notes: value })} multiline numberOfLines={3} editable={!budget || editable} />
      </FormSection>
      {budget ? (
        <>
          <FormSection title="ملخص سنوي" icon="insights">
            <AppText>الإيرادات المخططة: {revenue.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</AppText>
            <AppText>المصروفات المخططة: {expenses.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</AppText>
          </FormSection>
          <FormSection title="خطوط الموازنة" subtitle="اختر شهراً ثم عدّل كل خط. هذه خطوة هاتفية مكافئة لجدول الويب السنوي." icon="calendar-month">
            <AppSelect label="الشهر" value={String(month)} options={monthOptions} onChange={(value) => setMonth(Number(value))} />
            {grid.length === 0 ? <AppText>لا توجد خطوط بعد. استخدم «مزامنة التصنيفات» أو «تعبئة من الفعلي» لإنشائها من البيانات القانونية للخادم.</AppText> : null}
            {grid.map((row) => (
              <View key={row.key} style={{ gap: spacing.sm }}>
                <AppText>{row.label}</AppText>
                {row.section === 'labor' || row.section === 'opex' ? <AppSelect label="القسم" value={row.section} options={sectionOptions} onChange={(value) => patchLine(row.key, { section: value as BudgetSection })} /> : <AppText>{sectionLabel[row.section]}</AppText>}
                <AppInput label={`قيمة ${monthLabels[month - 1]}`} value={String(row.amounts[month] ?? 0)} onChangeText={(value) => patchAmount(row.key, value)} keyboardType="decimal-pad" editable={editable} />
              </View>
            ))}
          </FormSection>
        </>
      ) : null}
      <ConfirmDialog visible={deleteVisible} title="حذف الموازنة" message="لا يمكن التراجع عن الحذف." confirmLabel="حذف" loading={busy} onCancel={() => setDeleteVisible(false)} onConfirm={() => void remove()} />
    </FormScreenLayout>
  );
}
