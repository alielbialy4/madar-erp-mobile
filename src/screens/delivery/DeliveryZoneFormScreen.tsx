import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { deliveryZonesAPI } from '@/api/deliveryZones';
import { AppScreen } from '@/components/layout';
import { ConfirmDialog } from '@/components/feedback';
import { AppButton, AppInput } from '@/components/ui';
import { useBranchStore } from '@/store/branchStore';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';

export function DeliveryZoneFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = route.params?.id as string | undefined;
  const branch = useBranchStore((s) => s.activeBranch);
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    void deliveryZonesAPI.getById(id).then((res) => {
      const row = extractData(res) as Record<string, unknown> | undefined;
      if (row) {
        setName(String(row.name ?? ''));
        setFee(String(row.delivery_fee ?? ''));
      }
    });
  }, [id]);

  const save = async () => {
    if (!branch?.id || !name.trim()) {
      setError('الفرع والاسم مطلوبان');
      return;
    }
    setBusy(true);
    try {
      const payload = { branch_id: branch.id, name: name.trim(), delivery_fee: Number(fee || 0), is_active: true };
      if (id) await deliveryZonesAPI.update(id, payload);
      else await deliveryZonesAPI.create(payload);
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
      await deliveryZonesAPI.delete(id);
      navigation.goBack();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <AppScreen title={id ? 'تعديل منطقة' : 'منطقة جديدة'} onBack={navigation.goBack}>
      <View style={{ gap: spacing.md }}>
        {error ? <AppInput label="خطأ" value={error} editable={false} /> : null}
        <AppInput label="الاسم" value={name} onChangeText={setName} />
        <AppInput label="رسوم التوصيل" value={fee} onChangeText={setFee} keyboardType="decimal-pad" />
        <AppButton title="حفظ" onPress={() => void save()} loading={busy} />
        {id ? <AppButton title="حذف" variant="ghost" onPress={() => setDeleteConfirm(true)} /> : null}
      </View>
      <ConfirmDialog visible={deleteConfirm} title="حذف المنطقة" message="حذف منطقة التوصيل؟" confirmLabel="حذف" onConfirm={() => void remove()} onCancel={() => setDeleteConfirm(false)} loading={busy} />
    </AppScreen>
  );
}
