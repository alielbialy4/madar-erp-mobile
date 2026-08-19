import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { expensesAPI } from '@/api/expenses';
import { ListScreenLayout, SheetFormLayout } from '@/components/layout';
import { FormSection, SwitchRow } from '@/components/forms/FormSection';
import { AppBanner, AppErrorState, ConfirmDialog, useToast } from '@/components/feedback';
import { AppButton, AppInput, AppPicker } from '@/components/ui';
import { AppBadge } from '@/components/ui/AppBadge';
import { DenseRow } from '@/components/madar';
import { ResourceList } from '@/components/lists';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { usePermissions } from '@/hooks/usePermissions';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore } from '@/store/networkStore';
import { spacing } from '@/constants/spacing';
import { normalizeApiError } from '@/utils/errors';
import { isSystemPayrollCategory } from '@/utils/expenseCategories';
import type { ExpenseCategory } from '@/types/expenses';
import type { MoreStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<MoreStackParamList, 'ExpenseCategories'>;

type FormState = {
  name: string;
  description: string;
  branch_id: string;
  is_labor: boolean;
  is_active: boolean;
};

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  branch_id: '',
  is_labor: false,
  is_active: true,
});

export function ExpenseCategoriesScreen({ navigation }: Props) {
  const toast = useToast();
  const { can } = usePermissions();
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const viewMode = useBranchStore((state) => state.viewMode);
  const branches = useBranchStore((state) => state.branches);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(null);
  const canManage = can(['manage_expenses', 'access_admin_routes']);

  const loader = useCallback(
    () => {
      void reloadVersion;
      return expensesAPI.getCategories({
        ...(viewMode === 'branch' && activeBranch?.id ? { branch_id: activeBranch.id } : {}),
        include_inactive: true,
      });
    },
    [activeBranch?.id, reloadVersion, viewMode],
  );
  const { data = [], loading, refreshing, error: loadError, refresh } = useAsyncResource<ExpenseCategory[]>(loader);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm(),
      branch_id: viewMode === 'branch' ? activeBranch?.id ?? '' : '',
    });
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (category: ExpenseCategory) => {
    if (isSystemPayrollCategory(category)) {
      toast.show('فئة الرواتب النظامية تُستخدم من مسير الرواتب فقط ولا يمكن تعديلها.', 'info');
      return;
    }
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description ?? '',
      branch_id: category.branch_id ?? '',
      is_labor: Boolean(category.is_labor),
      is_active: category.is_active !== false,
    });
    setError(null);
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { setError('اسم التصنيف مطلوب.'); return; }
    if (!isOnline) { setError('تعديل التصنيفات يحتاج اتصالاً مباشراً بالخادم.'); return; }
    setSaving(true);
    setError(null);
    try {
      const common = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        is_labor: form.is_labor,
        is_active: form.is_active,
      };
      if (editing) {
        await expensesAPI.updateCategory(editing.id, common);
      } else {
        await expensesAPI.createCategory({ ...common, branch_id: form.branch_id || null });
      }
      toast.success(editing ? 'تم تحديث التصنيف' : 'تم إنشاء التصنيف');
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
      await expensesAPI.deleteCategory(deleteTarget.id);
      toast.success('تم حذف التصنيف');
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

  const branchOptions = useMemo(() => [
    { label: 'تصنيف عام لكل الفروع', value: '' },
    ...branches.map((branch) => ({ label: branch.name, value: branch.id })),
  ], [branches]);

  if (!canManage) {
    return (
      <ListScreenLayout title="تصنيفات المصروفات" onBack={navigation.goBack}>
        <AppErrorState message="إدارة تصنيفات المصروفات تتطلب صلاحية مدير المصروفات." />
      </ListScreenLayout>
    );
  }

  return (
    <>
      <ListScreenLayout
        title="تصنيفات المصروفات"
        subtitle="حوكمة بنود الصرف ونطاق استخدامها"
        onBack={navigation.goBack}
        onRefresh={refresh}
        refreshing={refreshing}
        hero={{
          eyebrow: 'إدارة المصروفات',
          title: 'دليل التصنيفات',
          subtitle: 'حدّد نطاق الفرع وعلامة تكلفة العمالة بدون خلطها بالرواتب النظامية',
          stats: [
            { label: 'الإجمالي', value: data.length },
            { label: 'نشط', value: data.filter((item) => item.is_active !== false).length, tone: 'success' },
            { label: 'عمالة', value: data.filter((item) => item.is_labor).length },
          ],
          compact: true,
        }}
        fab={{ onPress: openCreate, label: 'تصنيف جديد' }}
      >
        <ResourceList<ExpenseCategory>
          data={data}
          loading={loading}
          refreshing={refreshing}
          error={loadError}
          onRefresh={refresh}
          emptyTitle="لا توجد تصنيفات مصروفات"
          emptyCtaLabel="إنشاء أول تصنيف"
          onEmptyCta={openCreate}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <DenseRow
              primary={item.name}
              secondary={
                isSystemPayrollCategory(item)
                  ? 'فئة نظامية من مسير الرواتب — لا تُستخدم للمصروف اليدوي'
                  : (item.description?.trim() || (item.is_labor ? 'يدخل ضمن تكلفة العمالة التشغيلية' : 'تصنيف مصروف تشغيلي'))
              }
              meta={item.branch_id ? item.branch?.name ?? 'خاص بفرع' : 'عام لكل الفروع'}
              status={
                <AppBadge
                  label={isSystemPayrollCategory(item) ? 'نظامي' : item.is_active === false ? 'متوقف' : item.is_labor ? 'عمالة' : 'نشط'}
                  tone={isSystemPayrollCategory(item) ? 'info' : item.is_active === false ? 'danger' : item.is_labor ? 'info' : 'success'}
                />
              }
              onPress={() => openEdit(item)}
            />
          )}
        />
      </ListScreenLayout>

      <SheetFormLayout
        visible={formOpen}
        onClose={() => { if (!saving) setFormOpen(false); }}
        title={editing ? 'تعديل التصنيف' : 'تصنيف مصروف جديد'}
      >
        <View style={{ gap: spacing.lg }}>
          {!isOnline ? <AppBanner tone="warning" message="لا يمكن تعديل دليل التصنيفات أثناء عدم الاتصال." /> : null}
          {error ? <AppBanner tone="danger" message={error} /> : null}
          <FormSection title="هوية التصنيف" icon="category">
            <AppInput label="الاسم" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} required />
            <AppInput label="الوصف" value={form.description} onChangeText={(description) => setForm((current) => ({ ...current, description }))} multiline />
            {!editing ? (
              <AppPicker
                label="نطاق التصنيف"
                value={form.branch_id || null}
                options={branchOptions}
                onChange={(branch_id) => setForm((current) => ({ ...current, branch_id: branch_id ?? '' }))}
              />
            ) : (
              <AppBanner tone="info" message={`النطاق ثابت بعد الإنشاء: ${editing.branch_id ? editing.branch?.name ?? 'فرع محدد' : 'عام لكل الفروع'}.`} />
            )}
            <SwitchRow
              label="تصنيف تكلفة عمالة"
              hint="للتقارير التشغيلية فقط؛ لا يحل محل مسير الرواتب النظامي"
              value={form.is_labor}
              onValueChange={(is_labor) => setForm((current) => ({ ...current, is_labor }))}
            />
            <SwitchRow
              label="نشط"
              hint="التصنيف المتوقف لا يظهر في نماذج المصروفات الجديدة"
              value={form.is_active}
              onValueChange={(is_active) => setForm((current) => ({ ...current, is_active }))}
            />
          </FormSection>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <AppButton title={editing ? 'حفظ التعديل' : 'إنشاء التصنيف'} onPress={() => void save()} loading={saving} disabled={!isOnline || !form.name.trim()} style={{ flex: 1 }} />
            {editing ? <AppButton title="حذف" variant="dangerGhost" onPress={() => setDeleteTarget(editing)} disabled={saving || !isOnline} /> : null}
          </View>
        </View>
      </SheetFormLayout>

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="حذف تصنيف المصروف"
        message={`سيُحذف «${deleteTarget?.name ?? ''}» فقط إذا لم يكن مرتبطاً بمصروفات. إيقافه بديل أكثر أماناً عند وجود سجل سابق.`}
        confirmLabel="محاولة الحذف"
        loading={saving}
        onConfirm={() => void remove()}
        onCancel={() => { if (!saving) setDeleteTarget(null); }}
      />
    </>
  );
}
