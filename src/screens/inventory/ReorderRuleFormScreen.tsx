import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { reorderRulesAPI } from '@/api/reorderRules';
import { AppScreen } from '@/components/layout';
import { InventoryProductSearch } from '@/components/inventory/InventoryProductSearch';
import { AppButton, AppInput } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { normalizeApiError } from '@/utils/errors';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'ReorderRuleForm'>;
type Route = RouteProp<MoreStackParamList, 'ReorderRuleForm'>;

export function ReorderRuleFormScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const editId = route.params?.id;
  const [productId, setProductId] = useState<number | null>(null);
  const [productName, setProductName] = useState('');
  const [threshold, setThreshold] = useState('10');
  const [reorderTo, setReorderTo] = useState('50');
  const [submitting, setSubmitting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    if (!editId) return;
    void reorderRulesAPI.list({ per_page: 200 }).then((res) => {
      const rows = (res as { data?: Record<string, unknown>[] }).data ?? [];
      const row = (Array.isArray(rows) ? rows : []).find((r) => Number(r.id) === editId);
      if (row) {
        setProductId(Number(row.product_id));
        const p = row.product as Record<string, unknown> | undefined;
        setProductName(String(p?.name ?? row.product_name ?? ''));
        setThreshold(String(row.threshold ?? 10));
        setReorderTo(String(row.reorder_to ?? 50));
      }
    });
  }, [editId]);

  const submit = async () => {
    if (!productId) {
      Alert.alert('تنبيه', 'اختر منتجاً');
      return;
    }
    setConfirmVisible(false);
    setSubmitting(true);
    try {
      if (editId) {
        await reorderRulesAPI.update(editId, {
          threshold: Number(threshold),
          reorder_to: Number(reorderTo),
        });
      } else {
        await reorderRulesAPI.create({
          product_id: productId,
          threshold: Number(threshold),
          reorder_to: Number(reorderTo),
        });
      }
      Alert.alert('تم', 'تم حفظ قاعدة إعادة الطلب');
      navigation.goBack();
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen title={editId ? 'تعديل قاعدة' : 'قاعدة جديدة'} onBack={navigation.goBack}>
      {!editId ? <InventoryProductSearch onSelect={(p) => { setProductId(p.id); setProductName(p.name ?? ''); }} /> : null}
      {productName ? <AppInput label="المنتج" value={productName} editable={false} /> : null}
      <AppInput label="حد إعادة الطلب" keyboardType="numeric" value={threshold} onChangeText={setThreshold} />
      <AppInput label="إعادة الطلب إلى" keyboardType="numeric" value={reorderTo} onChangeText={setReorderTo} />
      <AppButton title="حفظ" loading={submitting} onPress={() => setConfirmVisible(true)} />
      <ConfirmDialog
        visible={confirmVisible}
        title="حفظ القاعدة"
        message={`المنتج: ${productName || '—'}\nحد: ${threshold} → ${reorderTo}`}
        confirmLabel="حفظ"
        loading={submitting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void submit()}
      />
    </AppScreen>
  );
}
