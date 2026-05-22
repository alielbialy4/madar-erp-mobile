import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { driversAPI } from '@/api/drivers';
import { AppScreen } from '@/components/layout';
import { AppButton, AppInput } from '@/components/ui';
import { useBranchStore } from '@/store/branchStore';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';

export function DriverFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = route.params?.id as string | undefined;
  const branch = useBranchStore((s) => s.activeBranch);
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
      navigation.goBack();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen title={id ? 'تعديل سائق' : 'سائق جديد'} onBack={navigation.goBack}>
      <View style={{ gap: spacing.md }}>
        {error ? <AppInput label="خطأ" value={error} editable={false} /> : null}
        <AppInput label="الاسم" value={name} onChangeText={setName} />
        <AppInput label="الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <AppInput label="المركبة" value={vehicle} onChangeText={setVehicle} />
        <AppButton title="حفظ" onPress={() => void save()} loading={busy} />
      </View>
    </AppScreen>
  );
}
