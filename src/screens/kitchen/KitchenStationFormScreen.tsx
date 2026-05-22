import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { kitchenStationsAPI } from '@/api/kitchenStations';
import { AppScreen } from '@/components/layout';
import { ConfirmDialog } from '@/components/feedback';
import { AppButton, AppInput } from '@/components/ui';
import { useBranchStore } from '@/store/branchStore';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';

export function KitchenStationFormScreen({ route, navigation }: { navigation: any; route: any }) {
  const id = route.params?.id as string | undefined;
  const branch = useBranchStore((s) => s.activeBranch);
  const [name, setName] = useState(route.params?.name ?? '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    void kitchenStationsAPI.get(id).then((res) => {
      const row = extractData(res) as Record<string, unknown> | undefined;
      if (row) {
        setName(String(row.name ?? ''));
        setCode(String(row.code ?? ''));
      }
    });
  }, [id]);

  const save = async () => {
    if (!name.trim()) {
      setError('اسم المحطة مطلوب');
      return;
    }
    setBusy(true);
    try {
      const payload = { name: name.trim(), code: code.trim() || null, branch_id: branch?.id, is_active: true };
      if (id) await kitchenStationsAPI.update(id, payload);
      else await kitchenStationsAPI.create(payload);
      navigation.goBack();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await kitchenStationsAPI.remove(id);
      navigation.goBack();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <AppScreen title={id ? 'تعديل محطة' : 'محطة جديدة'} onBack={navigation.goBack}>
      <View style={{ gap: spacing.md }}>
        {error ? <AppInput label="خطأ" value={error} editable={false} /> : null}
        <AppInput label="الاسم" value={name} onChangeText={setName} />
        <AppInput label="الرمز" value={code} onChangeText={setCode} />
        <AppButton title="حفظ" onPress={() => void save()} loading={busy} />
        {id ? <AppButton title="حذف" variant="ghost" onPress={() => setDeleteConfirm(true)} /> : null}
      </View>
      <ConfirmDialog visible={deleteConfirm} title="حذف المحطة" message="حذف محطة المطبخ؟" confirmLabel="حذف" onConfirm={() => void remove()} onCancel={() => setDeleteConfirm(false)} loading={busy} />
    </AppScreen>
  );
}
