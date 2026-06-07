import React, { useEffect, useState } from 'react';
import { driversAPI } from '@/api/drivers';
import { FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms';
import { useToast } from '@/components/feedback';
import { AppInput } from '@/components/ui';
import { useBranchStore } from '@/store/branchStore';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hapticError, hapticSuccess } from '@/utils/haptics';

export function DriverFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = route.params?.id as string | undefined;
  const branch = useBranchStore((s) => s.activeBranch);
  const toast = useToast();
  const [name, setName] = useState(route.params?.name ?? '');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void driversAPI.getById(id).then((res) => {
      const row = extractData(res) as Record<string, unknown> | undefined;
      if (row) {
        setName(String(row.name ?? ''));
        setPhone(String(row.phone ?? ''));
        setVehicle(String(row.vehicle_info ?? ''));
      }
    });
  }, [id]);

  const save = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('الاسم والهاتف مطلوبان');
      return;
    }
    setBusy(true);
    try {
      const payload = { name: name.trim(), phone: phone.trim(), branch_id: branch?.id, vehicle_info: vehicle.trim() || undefined };
      if (id) await driversAPI.update(id, payload);
      else await driversAPI.create(payload);
      toast.success(id ? 'تم تحديث السائق' : 'تم إنشاء السائق');
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
      title={id ? 'تعديل سائق' : 'سائق جديد'}
      onBack={navigation.goBack}
      onSave={() => void save()}
      saveLoading={busy}
    >
      <FormSection title="بيانات السائق" icon="delivery-dining">
        {error ? <AppInput label="خطأ" value={error} editable={false} /> : null}
        <AppInput label="الاسم" value={name} onChangeText={setName} />
        <AppInput label="الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <AppInput label="المركبة" value={vehicle} onChangeText={setVehicle} />
      </FormSection>
    </FormScreenLayout>
  );
}
