import React, { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { requisitionsAPI } from '@/api/requisitions';
import { FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms/FormSection';
import { InventoryProductSearch } from '@/components/inventory/InventoryProductSearch';
import { InventoryLineItemCard } from '@/components/inventory/InventoryLineItemCard';
import { AppInput } from '@/components/ui';
import { AppBanner, AppEmptyState, ConfirmDialog, useToast } from '@/components/feedback';
import { normalizeApiError } from '@/utils/errors';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'RequisitionCreate'>;

type Line = { product_id: number; product_name: string; quantity: string };

export function RequisitionCreateScreen({ navigation }: { navigation: Nav }) {
  const toast = useToast();
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const canSubmit = lines.length > 0 && lines.every((line) => Number(line.quantity) > 0);

  const addProduct = (p: { id: number; name?: string }) => {
    if (lines.some((l) => l.product_id === p.id)) return;
    setLines([...lines, { product_id: p.id, product_name: p.name ?? 'منتج', quantity: '1' }]);
  };

  const submit = async () => {
    if (!lines.length) {
      toast.show('أضف منتجاً واحداً على الأقل', 'warning');
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
      toast.success('تم إنشاء الطلب');
      if (id) navigation.replace('RequisitionDetail', { id });
      else navigation.goBack();
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreenLayout
      title="طلب توريد جديد"
      subtitle="تجهيز احتياج داخلي للمراجعة والتوريد"
      onBack={navigation.goBack}
      heroTitle="احتياج المخزون"
      heroSubtitle="أضف الأصناف المطلوبة وحدد الكمية لكل صنف قبل إرسال الطلب للمراجعة."
      heroAmount={`${lines.length} صنف`}
      saveLabel="مراجعة وإرسال الطلب"
      onSave={() => setConfirmVisible(true)}
      saveLoading={submitting}
      saveDisabled={!canSubmit || submitting}
      onCancel={navigation.goBack}
    >
      <AppBanner
        tone="info"
        message="إنشاء الطلب لا يغيّر الرصيد. سيبقى الطلب ضمن دورة المراجعة حتى اعتماده وتنفيذه."
      />
      <FormSection
        title="الأصناف المطلوبة"
        subtitle="ابحث عن الصنف ثم اضغط لإضافته إلى الطلب"
        icon="inventory-2"
      >
        <InventoryProductSearch onSelect={addProduct} />
        {lines.length === 0 ? (
          <AppEmptyState
            title="لم تضف أصنافًا بعد"
            message="استخدم البحث أعلاه لبناء قائمة الاحتياج."
          />
        ) : null}
        {lines.map((line, index) => (
          <InventoryLineItemCard
            key={line.product_id}
            title={line.product_name}
            onRemove={() => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}
          >
            <AppInput
              label="الكمية"
              keyboardType="numeric"
              value={line.quantity}
              onChangeText={(v) => {
                const next = [...lines];
                next[index] = { ...line, quantity: v };
                setLines(next);
              }}
              error={Number(line.quantity) > 0 ? undefined : 'أدخل كمية أكبر من صفر'}
            />
          </InventoryLineItemCard>
        ))}
      </FormSection>
      <FormSection
        title="سياق الطلب"
        subtitle="أضف توضيحًا يساعد المسؤول عند المراجعة"
        icon="notes"
      >
        <AppInput
          label="ملاحظات"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="سبب الاحتياج أو الموعد المطلوب"
        />
      </FormSection>
      <ConfirmDialog
        visible={confirmVisible}
        title="إنشاء طلب"
        message={`سيتم إرسال طلب يحتوي على ${lines.length} صنف للمراجعة دون تغيير رصيد المخزون الآن.`}
        confirmLabel="إرسال الطلب"
        loading={submitting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void submit()}
      />
    </FormScreenLayout>
  );
}
