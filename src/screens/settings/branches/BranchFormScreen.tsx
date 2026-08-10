import React, { useCallback, useEffect, useState } from 'react';
import { branchesManageAPI } from '@/api/branchesManage';
import { warehousesAPI } from '@/api/inventory';
import { vaultsAPI } from '@/api/vaults';
import { FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { AppInput, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { hasPermission } from '@/utils/permissions';
import { extractArray, extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { useColors } from '@/hooks/useColors';
import { hapticError, hapticSuccess } from '@/utils/haptics';
import type { SelectOption } from '@/components/ui/AppSelect';
import type { BranchManageRow } from '@/types/branches';

const STATUS_OPTS: SelectOption[] = [
  { label: 'نشط', value: 'active' },
  { label: 'غير نشط', value: 'inactive' },
];

const MAIN_OPTS: SelectOption[] = [
  { label: 'لا', value: '0' },
  { label: 'فرع رئيسي', value: '1' },
];

type FormState = {
  name: string;
  code: string;
  location: string;
  contact_phone: string;
  contact_email: string;
  status: 'active' | 'inactive';
  is_main: boolean;
  warehouse_id: string;
  vault_id: string;
  warehouse_name: string;
  vault_name: string;
};

const emptyForm = (): FormState => ({
  name: '',
  code: '',
  location: '',
  contact_phone: '',
  contact_email: '',
  status: 'active',
  is_main: false,
  warehouse_id: '',
  vault_id: '',
  warehouse_name: '',
  vault_name: '',
});

export function BranchFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const c = useColors();
  const toast = useToast();
  const id = route.params?.id as string | undefined;
  const isEdit = Boolean(id);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_branches');
  const loadBranches = useBranchStore((s) => s.loadBranches);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [warehouseOptions, setWarehouseOptions] = useState<SelectOption[]>([]);
  const [vaultOptions, setVaultOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const loadOptions = useCallback(async () => {
    try {
      const [whRes, vaultRes] = await Promise.all([
        warehousesAPI.list({ status: 'active', per_page: 100 } as never),
        vaultsAPI.list({ active_only: false, per_page: 100 } as never),
      ]);
      const warehouses = extractArray<{ id: string; name: string; branch?: { name: string } | null }>(whRes);
      setWarehouseOptions(
        warehouses.map((w) => ({
          label: `${w.name}${w.branch?.name ? ` (${w.branch.name})` : ''}`,
          value: String(w.id),
        })),
      );
      const vaults = extractArray<{ id: string; name: string }>(vaultRes);
      setVaultOptions(vaults.map((v) => ({ label: v.name, value: String(v.id) })));
    } catch {
      setWarehouseOptions([]);
      setVaultOptions([]);
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    branchesManageAPI
      .get(id)
      .then((res) => {
        const b = extractData<BranchManageRow>(res);
        if (!b) return;
        setForm({
          name: b.name,
          code: b.code,
          location: b.location ?? '',
          contact_phone: b.contact_info?.phone ?? b.phone ?? '',
          contact_email: b.contact_info?.email ?? b.email ?? '',
          status: b.status === 'inactive' ? 'inactive' : 'active',
          is_main: Boolean(b.is_main),
          warehouse_id: String(b.warehouse_id ?? b.default_warehouse_id ?? b.default_warehouse?.id ?? ''),
          vault_id: String(b.vault_id ?? b.default_vault_id ?? b.default_vault?.id ?? ''),
          warehouse_name: '',
          vault_name: '',
        });
      })
      .catch((err) => setError(normalizeApiError(err).message))
      .finally(() => setLoading(false));
  }, [id]);

  const patch = (partial: Partial<FormState>) => setForm((f) => ({ ...f, ...partial }));

  const save = async () => {
    if (!canManage) {
      setError('ليس لديك صلاحية manage_branches');
      return;
    }
    if (!form.name.trim() || !form.code.trim()) {
      setError('الاسم والكود مطلوبان');
      return;
    }
    if (!isEdit && !form.warehouse_id && !form.warehouse_name.trim()) {
      setError('يجب اختيار مخزن أو كتابة اسم مخزن جديد');
      return;
    }
    if (!isEdit && !form.vault_id && !form.vault_name.trim()) {
      setError('يجب اختيار خزينة أو كتابة اسم خزينة جديدة');
      return;
    }

    setBusy(true);
    setError(null);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      code: form.code.trim(),
      location: form.location.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      contact_email: form.contact_email.trim() || null,
      status: form.status,
      is_main: form.is_main,
      warehouse_id: form.warehouse_id || undefined,
      vault_id: form.vault_id || undefined,
      warehouse_name: !form.warehouse_id && !isEdit ? form.warehouse_name.trim() || undefined : undefined,
      vault_name: !form.vault_id && !isEdit ? form.vault_name.trim() || undefined : undefined,
    };

    try {
      if (isEdit && id) {
        await branchesManageAPI.update(id, payload);
      } else {
        await branchesManageAPI.create(payload);
      }
      await loadBranches();
      toast.success(isEdit ? 'تم تحديث الفرع' : 'تم إنشاء الفرع');
      void hapticSuccess();
      if (isEdit && id) {
        navigation.navigate('BranchDetail', { id });
      } else {
        navigation.goBack();
      }
    } catch (err) {
      const msg = normalizeApiError(err).message;
      setError(msg);
      toast.error(msg);
      void hapticError();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!id || !canManage) return;
    setBusy(true);
    try {
      await branchesManageAPI.delete(id);
      await loadBranches();
      toast.success('تم حذف الفرع');
      void hapticSuccess();
      navigation.navigate('BranchesList');
    } catch (err) {
      const msg = normalizeApiError(err).message;
      setError(msg);
      toast.error(msg);
      void hapticError();
    } finally {
      setBusy(false);
      setDeleteConfirm(false);
    }
  };

  if (!canManage) {
    return (
      <FormScreenLayout title="فرع" onBack={navigation.goBack}>
        <Text>ليس لديك صلاحية إدارة الفروع.</Text>
      </FormScreenLayout>
    );
  }

  return (
    <FormScreenLayout
      title={isEdit ? 'تعديل فرع' : 'فرع جديد'}
      onBack={navigation.goBack}
      onSave={() => void save()}
      saveLoading={busy}
      onDelete={isEdit && id ? () => setDeleteConfirm(true) : undefined}
    >
      {loading ? <Text>جاري التحميل…</Text> : null}
      <FormSection title="بيانات الفرع" icon="store">
        {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
        <AppInput label="اسم الفرع *" value={form.name} onChangeText={(t) => patch({ name: t })} />
        <AppInput label="كود الفرع *" value={form.code} onChangeText={(t) => patch({ code: t })} editable={!isEdit} />
        <AppInput label="الموقع" value={form.location} onChangeText={(t) => patch({ location: t })} />
        <AppInput label="هاتف التواصل" value={form.contact_phone} onChangeText={(t) => patch({ contact_phone: t })} keyboardType="phone-pad" />
        <AppInput label="بريد التواصل" value={form.contact_email} onChangeText={(t) => patch({ contact_email: t })} keyboardType="email-address" autoCapitalize="none" />
        <AppSelect label="الحالة" value={form.status} options={STATUS_OPTS} onChange={(v) => patch({ status: v as 'active' | 'inactive' })} />
        <AppSelect label="فرع رئيسي" value={form.is_main ? '1' : '0'} options={MAIN_OPTS} onChange={(v) => patch({ is_main: v === '1' })} />
      </FormSection>
      <FormSection title="المخزن الافتراضي" icon="warehouse" subtitle={!isEdit ? 'مطلوب عند الإنشاء' : undefined}>
        <AppSelect
          label="اختر مخزن"
          value={form.warehouse_id || null}
          options={[{ label: '— بدون —', value: '' }, ...warehouseOptions]}
          onChange={(v) => patch({ warehouse_id: v, warehouse_name: v ? '' : form.warehouse_name })}
        />
        {!form.warehouse_id && !isEdit ? (
          <AppInput label="اسم مخزن جديد" value={form.warehouse_name} onChangeText={(t) => patch({ warehouse_name: t })} />
        ) : null}
      </FormSection>
      <FormSection title="الخزينة الافتراضية" icon="account-balance-wallet" subtitle={!isEdit ? 'مطلوب عند الإنشاء' : undefined}>
        <AppSelect
          label="اختر خزينة"
          value={form.vault_id || null}
          options={[{ label: '— بدون —', value: '' }, ...vaultOptions]}
          onChange={(v) => patch({ vault_id: v, vault_name: v ? '' : form.vault_name })}
        />
        {!form.vault_id && !isEdit ? (
          <AppInput label="اسم خزينة جديدة" value={form.vault_name} onChangeText={(t) => patch({ vault_name: t })} />
        ) : null}
      </FormSection>
      <ConfirmDialog
        visible={deleteConfirm}
        title="حذف الفرع"
        message="هل أنت متأكد من حذف هذا الفرع؟"
        confirmLabel="حذف"
        onConfirm={() => void remove()}
        onCancel={() => setDeleteConfirm(false)}
        loading={busy}
      />
    </FormScreenLayout>
  );
}
