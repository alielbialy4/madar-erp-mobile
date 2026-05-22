import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { requisitionsAPI } from '@/api/requisitions';
import { AppScreen } from '@/components/layout';
import { InventoryProductSearch } from '@/components/inventory/InventoryProductSearch';
import { AppButton, AppInput, AppListItem, AppSectionHeader, AppCard } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'RequisitionCreate'>;

type Line = { product_id: number; product_name: string; quantity: string };

export function RequisitionCreateScreen({ navigation }: { navigation: Nav }) {
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const addProduct = (p: { id: number; name?: string }) => {
    if (lines.some((l) => l.product_id === p.id)) return;
    setLines([...lines, { product_id: p.id, product_name: p.name ?? 'منتج', quantity: '1' }]);
  };

  const submit = async () => {
    if (!lines.length) {
      Alert.alert('تنبيه', 'أضف منتجاً واحداً على الأقل');
      return;
    }
    setConfirmVisible(false);
    setSubmitting(true);
    try {
      const res = await requisitionsAPI.create({
        notes: notes.trim() || undefined,
        items: lines.map((l) => ({ product_id: l.product_id, quantity: Number(l.quantity) || 0 })),
      });
      const data = (res as { data?: Record<string, unknown> }).data ?? res;
      const id = String((data as Record<string, unknown>).id ?? '');
      Alert.alert('تم', 'تم إنشاء الطلب');
      if (id) navigation.replace('RequisitionDetail', { id });
      else navigation.goBack();
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen title="طلب توريد جديد" onBack={navigation.goBack}>
      <AppCard style={{ gap: spacing.md }}>
        <AppSectionHeader title="البنود" />
        <InventoryProductSearch onSelect={addProduct} />
        {lines.map((line, index) => (
          <View key={line.product_id} style={{ gap: spacing.sm }}>
            <AppListItem title={line.product_name} />
            <AppInput
              label="الكمية"
              keyboardType="numeric"
              value={line.quantity}
              onChangeText={(v) => {
                const next = [...lines];
                next[index] = { ...line, quantity: v };
                setLines(next);
              }}
            />
          </View>
        ))}
      </AppCard>
      <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline />
      <AppButton title="إنشاء الطلب" disabled={!lines.length} loading={submitting} onPress={() => setConfirmVisible(true)} />
      <ConfirmDialog
        visible={confirmVisible}
        title="إنشاء طلب"
        message={`${lines.length} صنف`}
        confirmLabel="إنشاء"
        loading={submitting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void submit()}
      />
    </AppScreen>
  );
}
