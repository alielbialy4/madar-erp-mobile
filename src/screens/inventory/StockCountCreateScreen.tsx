import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { stockCountsAPI } from '@/api/stockCounts';
import { inventoryAPI } from '@/api/inventory';
import { AppScreen } from '@/components/layout';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import type { SelectOption } from '@/components/ui/AppSelect';
import { ConfirmDialog, AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockCountCreate'>;

export function StockCountCreateScreen({ navigation }: { navigation: Nav }) {
  const [warehouses, setWarehouses] = useState<SelectOption[]>([]);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    void inventoryAPI.warehouses().then((res) => {
      const list = extractArray<Record<string, unknown>>(res);
      setWarehouses(list.map((w) => ({ label: String(w.name), value: String(w.id) })));
      if (list.length === 1) setWarehouseId(String(list[0].id));
      setLoading(false);
    }).catch((err) => {
      setError(normalizeApiError(err).message);
      setLoading(false);
    });
  }, []);

  const submit = useCallback(async () => {
    if (!warehouseId) return;
    setConfirmVisible(false);
    setSubmitting(true);
    try {
      const res = await stockCountsAPI.create({ warehouse_id: warehouseId, notes: notes.trim() || undefined });
      const data = (res as { data?: Record<string, unknown> }).data ?? res;
      const id = String((data as Record<string, unknown>).id ?? '');
      if (id) {
        navigation.replace('StockCountDetail', { id });
      } else {
        Alert.alert('تم', 'تم إنشاء جلسة الجرد');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  }, [navigation, notes, warehouseId]);

  if (loading) {
    return (
      <AppScreen title="جرد جديد" onBack={navigation.goBack}>
        <AppLoadingState />
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen title="جرد جديد" onBack={navigation.goBack}>
        <AppErrorState message={error} />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="جرد جديد" onBack={navigation.goBack}>
      <AppSelect label="المستودع" value={warehouseId} options={warehouses} onChange={setWarehouseId} />
      <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline />
      <AppButton title="بدء الجرد" disabled={!warehouseId || submitting} loading={submitting} onPress={() => setConfirmVisible(true)} />
      <ConfirmDialog
        visible={confirmVisible}
        title="بدء جلسة جرد"
        message="سيتم إنشاء جلسة جرد مسودة يمكنك إدخال الكميات فيها ثم ترحيلها."
        confirmLabel="إنشاء"
        loading={submitting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void submit()}
      />
    </AppScreen>
  );
}
