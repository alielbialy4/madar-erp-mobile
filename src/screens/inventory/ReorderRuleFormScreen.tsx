import React, { useEffect, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { reorderRulesAPI } from '@/api/reorderRules';
import { FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms';
import { InventoryProductSearch } from '@/components/inventory/InventoryProductSearch';
import { AppInput } from '@/components/ui';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { normalizeApiError } from '@/utils/errors';
import { hapticError, hapticSuccess } from '@/utils/haptics';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'ReorderRuleForm'>;
type Route = RouteProp<MoreStackParamList, 'ReorderRuleForm'>;

export function ReorderRuleFormScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const editId = route.params?.id;
  const toast = useToast();
  const [productId, setProductId] = useState<number | null>(null);
  const [productName, setProductName] = useState('');
  const [threshold, setThreshold] = useState('10');
  const [reorderTo, setReorderTo] = useState('50');
  const [submitting, setSubmitting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    if (!editId) return;
    void reorderRulesAPI.findById(editId).then((row) => {
      if (!row) return;
      setProductId(Number(row.product_id));
      const p = row.product as Record<string, unknown> | undefined;
      setProductName(String(p?.name ?? row.product_name ?? ''));
      setThreshold(String(row.threshold ?? 10));
      setReorderTo(String(row.reorder_to ?? 50));
    });
  }, [editId]);

  const submit = async () => {
    if (!productId) {
      toast.show('اختر منتجاً', 'warning');
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
      toast.success('تم حفظ قاعدة إعادة الطلب');
      void hapticSuccess();
      navigation.goBack();
    } catch (err) {
      const msg = normalizeApiError(err).message;
      toast.error(msg);
      void hapticError();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreenLayout
      title={editId ? 'تعديل قاعدة' : 'قاعدة جديدة'}
      onBack={navigation.goBack}
      onSave={() => setConfirmVisible(true)}
      saveLoading={submitting}
    >
      <FormSection title="المنتج" icon="inventory-2">
        {!editId ? <InventoryProductSearch onSelect={(p) => { setProductId(p.id); setProductName(p.name ?? ''); }} /> : null}
        {productName ? <AppInput label="المنتج" value={productName} editable={false} /> : null}
      </FormSection>
      <FormSection title="حدود إعادة الطلب" icon="low-priority">
        <AppInput label="حد إعادة الطلب" keyboardType="numeric" value={threshold} onChangeText={setThreshold} />
        <AppInput label="إعادة الطلب إلى" keyboardType="numeric" value={reorderTo} onChangeText={setReorderTo} />
      </FormSection>
      <ConfirmDialog
        visible={confirmVisible}
        title="حفظ القاعدة"
        message={`المنتج: ${productName || '—'}\nحد: ${threshold} → ${reorderTo}`}
        confirmLabel="حفظ"
        loading={submitting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void submit()}
      />
    </FormScreenLayout>
  );
}
