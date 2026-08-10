import React, { useCallback, useEffect, useState } from 'react';
import { branchesManageAPI } from '@/api/branchesManage';
import { FormScreenLayout } from '@/components/layout';
import { FormSection, SwitchRow } from '@/components/forms/FormSection';
import { AppErrorState, AppLoadingState, useToast } from '@/components/feedback';
import { AppInput, AppSelect } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { usePosStore } from '@/store/posStore';
import { hasPermission } from '@/utils/permissions';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import {
  buildBranchSettingsPayload,
  defaultBranchSettingsForm,
  parseBranchSettingsObject,
  type BranchSettingsForm,
} from '@/utils/branchSettings';
import type { BranchManageRow } from '@/types/branches';
import type { SelectOption } from '@/components/ui/AppSelect';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';
import { hapticError, hapticSuccess } from '@/utils/haptics';

type Props = NativeStackScreenProps<MoreStackParamList, 'BranchPosSettings'>;

const SERVICE_TYPE_OPTS: SelectOption[] = [
  { label: 'نسبة مئوية', value: 'percentage' },
  { label: 'مبلغ ثابت', value: 'fixed' },
];

const SERVICE_APPLY_OPTS: SelectOption[] = [
  { label: 'صالة', value: 'dine_in' },
  { label: 'توصيل', value: 'delivery' },
  { label: 'تيك أواي', value: 'takeaway' },
  { label: 'الكل', value: 'all' },
];

export function BranchPosSettingsScreen({ navigation, route }: Props) {
  const branchId = String(route.params?.id ?? '');
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_branches');
  const loadCatalog = usePosStore((s) => s.loadCatalog);

  const [branchName, setBranchName] = useState('');
  const [settings, setSettings] = useState<BranchSettingsForm>(defaultBranchSettingsForm());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await branchesManageAPI.get(branchId);
      const b = extractData<BranchManageRow>(res);
      if (!b) throw new Error('الفرع غير موجود');
      setBranchName(b.name);
      const raw =
        b.settings && typeof b.settings === 'object'
          ? (b.settings as Record<string, unknown>)
          : undefined;
      setSettings(parseBranchSettingsObject(raw));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!canManage) {
      toast.error('ليس لديك صلاحية manage_branches');
      return;
    }
    setBusy(true);
    try {
      await branchesManageAPI.patchSettings(
        branchId,
        buildBranchSettingsPayload(settings, [
          'tax_enabled',
          'tax_rate',
          'tax_name',
          'tax_inclusive',
          'service_charge_enabled',
          'service_charge_type',
          'service_charge_value',
          'service_charge_apply_to',
          'service_charge_label',
          'allow_pos_discount',
          'allow_pos_coupon',
        ]),
      );
      await loadCatalog();
      toast.success('تم حفظ إعدادات POS');
      void hapticSuccess();
      navigation.goBack();
    } catch (err) {
      const msg = normalizeApiError(err).message;
      toast.error(msg);
      void hapticError();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <FormScreenLayout title="إعدادات POS" onBack={navigation.goBack}>
        <AppLoadingState message="جاري التحميل…" />
      </FormScreenLayout>
    );
  }

  if (error) {
    return (
      <FormScreenLayout title="إعدادات POS" onBack={navigation.goBack}>
        <AppErrorState message={error} onRetry={() => void load()} />
      </FormScreenLayout>
    );
  }

  return (
    <FormScreenLayout
      title="إعدادات POS"
      subtitle={branchName}
      onBack={navigation.goBack}
      onSave={canManage ? () => void save() : undefined}
      saveLoading={busy}
    >
      <FormSection title="الضريبة" icon="percent">
        <SwitchRow
          label="تفعيل الضريبة"
          value={settings.tax_enabled}
          onValueChange={(v) => setSettings((s) => ({ ...s, tax_enabled: v }))}
        />
        {settings.tax_enabled ? (
          <>
            <AppInput
              label="نسبة الضريبة %"
              value={settings.tax_rate}
              onChangeText={(t) => setSettings((s) => ({ ...s, tax_rate: t }))}
              keyboardType="decimal-pad"
            />
            <AppInput
              label="اسم الضريبة"
              value={settings.tax_name}
              onChangeText={(t) => setSettings((s) => ({ ...s, tax_name: t }))}
            />
            <SwitchRow
              label="الأسعار شاملة الضريبة"
              value={settings.tax_inclusive}
              onValueChange={(v) => setSettings((s) => ({ ...s, tax_inclusive: v }))}
            />
          </>
        ) : null}
      </FormSection>

      <FormSection title="رسوم الخدمة" icon="room-service">
        <SwitchRow
          label="تفعيل رسوم الخدمة"
          value={settings.service_charge_enabled}
          onValueChange={(v) => setSettings((s) => ({ ...s, service_charge_enabled: v }))}
        />
        {settings.service_charge_enabled ? (
          <>
            <AppSelect
              label="نوع الرسوم"
              value={settings.service_charge_type}
              options={SERVICE_TYPE_OPTS}
              onChange={(v) =>
                setSettings((s) => ({ ...s, service_charge_type: v as 'percentage' | 'fixed' }))
              }
            />
            <AppInput
              label="قيمة الرسوم"
              value={settings.service_charge_value}
              onChangeText={(t) => setSettings((s) => ({ ...s, service_charge_value: t }))}
              keyboardType="decimal-pad"
            />
            <AppSelect
              label="تطبيق على"
              value={settings.service_charge_apply_to}
              options={SERVICE_APPLY_OPTS}
              onChange={(v) =>
                setSettings((s) => ({
                  ...s,
                  service_charge_apply_to: v as BranchSettingsForm['service_charge_apply_to'],
                }))
              }
            />
            <AppInput
              label="تسمية الرسوم"
              value={settings.service_charge_label}
              onChangeText={(t) => setSettings((s) => ({ ...s, service_charge_label: t }))}
            />
          </>
        ) : null}
      </FormSection>

      <FormSection title="خصومات POS" icon="local-offer">
        <SwitchRow
          label="السماح بالخصم اليدوي"
          value={settings.allow_pos_discount}
          onValueChange={(v) => setSettings((s) => ({ ...s, allow_pos_discount: v }))}
        />
        <SwitchRow
          label="السماح بالكوبونات"
          value={settings.allow_pos_coupon}
          onValueChange={(v) => setSettings((s) => ({ ...s, allow_pos_coupon: v }))}
        />
      </FormSection>
    </FormScreenLayout>
  );
}
