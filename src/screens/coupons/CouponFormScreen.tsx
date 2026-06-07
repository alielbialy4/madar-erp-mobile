import React, { useEffect, useState } from 'react';
import { couponsAPI } from '@/api/coupons';
import { FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms';
import { useToast } from '@/components/feedback';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { hasPermission } from '@/utils/permissions';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hapticError, hapticSuccess } from '@/utils/haptics';

export function CouponFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = route.params?.id as string | undefined;
  const user = useAuthStore((s) => s.user);
  const branch = useBranchStore((s) => s.activeBranch);
  const canManage = hasPermission(user, ['manage_coupons', 'manage_settings']);
  const toast = useToast();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [branchId, setBranchId] = useState(branch?.id ?? '');
  const [isActive, setIsActive] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void couponsAPI.get(id).then((res) => {
      const c = extractData(res) as Record<string, unknown> | undefined;
      if (!c) return;
      setCode(String(c.code ?? ''));
      setName(String(c.name ?? ''));
      setType(String(c.type ?? 'percentage'));
      setValue(String(c.value ?? ''));
      setMinOrder(c.min_order_amount != null ? String(c.min_order_amount) : '');
      setMaxDiscount(c.max_discount_amount != null ? String(c.max_discount_amount) : '');
      setBranchId(String(c.branch_id ?? ''));
      setIsActive(c.is_active === false ? '0' : '1');
    });
  }, [id]);

  const save = async () => {
    if (!canManage) {
      setError('ليس لديك صلاحية لتنفيذ هذه العملية.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type,
        value: Number(value) || 0,
        min_order_amount: minOrder.trim() ? Number(minOrder) : null,
        max_discount_amount: maxDiscount.trim() ? Number(maxDiscount) : null,
        branch_id: branchId.trim() || null,
        is_active: isActive === '1',
      };
      if (id) await couponsAPI.update(id, payload);
      else await couponsAPI.create(payload);
      toast.success(id ? 'تم تحديث الكوبون' : 'تم إنشاء الكوبون');
      void hapticSuccess();
      navigation.goBack();
    } catch (err) {
      const msg = normalizeApiError(err).message;
      setError(msg);
      toast.error(msg);
      void hapticError();
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormScreenLayout
      title={id ? 'تعديل كوبون' : 'كوبون جديد'}
      onBack={navigation.goBack}
      onSave={canManage ? () => void save() : undefined}
      saveLoading={busy}
    >
      <FormSection title="بيانات الكوبون" icon="local-offer">
        {error ? <AppInput label="خطأ" value={error} editable={false} /> : null}
        <AppInput label="الكود" value={code} onChangeText={setCode} autoCapitalize="characters" editable={canManage} />
        <AppInput label="الاسم" value={name} onChangeText={setName} editable={canManage} />
        <AppSelect
          label="النوع"
          value={type}
          options={[
            { label: 'نسبة', value: 'percentage' },
            { label: 'مبلغ ثابت', value: 'fixed' },
          ]}
          onChange={setType}
        />
        <AppInput label="القيمة" value={value} onChangeText={setValue} keyboardType="decimal-pad" editable={canManage} />
        <AppInput label="حد أدنى للطلب" value={minOrder} onChangeText={setMinOrder} keyboardType="decimal-pad" editable={canManage} />
        <AppInput label="أقصى خصم" value={maxDiscount} onChangeText={setMaxDiscount} keyboardType="decimal-pad" editable={canManage} />
        <AppInput label="معرف الفرع (فارغ = الكل)" value={branchId} onChangeText={setBranchId} editable={canManage} />
        <AppSelect label="نشط" value={isActive} options={[{ label: 'نعم', value: '1' }, { label: 'لا', value: '0' }]} onChange={setIsActive} />
      </FormSection>
      <FormSection title="تقارير" icon="assessment">
        <AppButton title="تقرير الكوبونات" variant="secondary" onPress={() => navigation.navigate('ReportViewer', { reportId: 'marketing-coupons' })} />
      </FormSection>
    </FormScreenLayout>
  );
}
