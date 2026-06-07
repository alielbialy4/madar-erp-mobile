import React, { useEffect, useState } from 'react';
import { promotionsAPI } from '@/api/promotions';
import { FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms';
import { useToast } from '@/components/feedback';
import { AppButton, AppDatePicker, AppInput, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { hasPermission } from '@/utils/permissions';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hapticError, hapticSuccess } from '@/utils/haptics';
import { useColors } from '@/hooks/useColors';

export function PromotionFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const c = useColors();
  const id = route.params?.id as string | undefined;
  const user = useAuthStore((s) => s.user);
  const branch = useBranchStore((s) => s.activeBranch);
  const canManage = hasPermission(user, ['manage_coupons', 'manage_settings']);
  const toast = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState('percentage_discount');
  const [rewardValue, setRewardValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minCart, setMinCart] = useState('');
  const [priority, setPriority] = useState('0');
  const [isActive, setIsActive] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void promotionsAPI.getById(id).then((res) => {
      const p = extractData(res) as Record<string, unknown> | undefined;
      if (!p) return;
      setName(String(p.name ?? ''));
      setType(String(p.type ?? 'percentage_discount'));
      setRewardValue(String(p.reward_value ?? ''));
      setStartDate(String(p.start_date ?? '').slice(0, 10));
      setEndDate(String(p.end_date ?? '').slice(0, 10));
      setPriority(String(p.priority ?? 0));
      setIsActive(p.is_active === false ? '0' : '1');
      const cond = Array.isArray(p.conditions) ? (p.conditions as Record<string, unknown>[]) : [];
      const min = cond.find((x) => x.condition_type === 'min_cart_total');
      if (min) setMinCart(String((min.condition_value as Record<string, unknown>)?.min ?? ''));
    });
  }, [id]);

  const save = async () => {
    if (!canManage) {
      setError('ليس لديك صلاحية لتنفيذ هذه العملية.');
      return;
    }
    setBusy(true);
    try {
      const conditions = minCart.trim()
        ? [{ condition_type: 'min_cart_total', condition_value: { min: Number(minCart) } }]
        : [];
      const payload: Record<string, unknown> = {
        name: name.trim(),
        type,
        reward_value: Number(rewardValue) || 0,
        start_date: startDate || new Date().toISOString().slice(0, 10),
        end_date: endDate || new Date().toISOString().slice(0, 10),
        is_active: isActive === '1',
        priority: Number(priority) || 0,
        branch_id: branch?.id ?? null,
        conditions,
      };
      if (id) await promotionsAPI.update(id, payload);
      else await promotionsAPI.create(payload);
      toast.success(id ? 'تم تحديث العرض' : 'تم إنشاء العرض');
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
      title={id ? 'تعديل عرض' : 'عرض جديد'}
      onBack={navigation.goBack}
      onSave={canManage ? () => void save() : undefined}
      saveLoading={busy}
    >
      <FormSection title="تفاصيل العرض" icon="campaign">
        {error ? <AppInput label="خطأ" value={error} editable={false} /> : null}
        <Text style={{ color: c.textMuted, fontSize: 12 }}>
          العروض تُطبَّق تلقائياً في POS عند استيفاء الشروط (مثل الحد الأدنى للسلة). التحقق من الكوبون يبقى منفصلاً ويتطلب شبكة عند عدم وجود كاش محلي.
        </Text>
        <AppInput label="الاسم" value={name} onChangeText={setName} editable={canManage} />
        <AppSelect
          label="النوع"
          value={type}
          options={[
            { label: 'نسبة', value: 'percentage_discount' },
            { label: 'مبلغ ثابت', value: 'fixed_discount' },
            { label: 'BOGO', value: 'bogo' },
          ]}
          onChange={setType}
        />
        <AppInput label="قيمة المكافأة" value={rewardValue} onChangeText={setRewardValue} keyboardType="decimal-pad" editable={canManage} />
        <AppDatePicker label="تاريخ البداية" value={startDate} onChange={setStartDate} />
        <AppDatePicker label="تاريخ النهاية" value={endDate} onChange={setEndDate} />
        <AppInput label="حد أدنى للسلة (شرط)" value={minCart} onChangeText={setMinCart} keyboardType="decimal-pad" editable={canManage} />
        <AppInput label="الأولوية" value={priority} onChangeText={setPriority} keyboardType="number-pad" editable={canManage} />
        <AppSelect label="نشط" value={isActive} options={[{ label: 'نعم', value: '1' }, { label: 'لا', value: '0' }]} onChange={setIsActive} />
      </FormSection>
      <FormSection title="تقارير" icon="assessment">
        <AppButton title="تقرير العروض" variant="secondary" onPress={() => navigation.navigate('ReportViewer', { reportId: 'marketing-promotions' })} />
      </FormSection>
    </FormScreenLayout>
  );
}
