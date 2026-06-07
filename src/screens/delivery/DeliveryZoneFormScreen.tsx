import React, { useEffect, useState } from 'react';
import { deliveryZonesAPI } from '@/api/deliveryZones';
import { FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { AppInput } from '@/components/ui';
import { useBranchStore } from '@/store/branchStore';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hapticError, hapticSuccess } from '@/utils/haptics';

export function DeliveryZoneFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = route.params?.id as string | undefined;
  const branch = useBranchStore((s) => s.activeBranch);
  const toast = useToast();
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
      toast.success(id ? 'تم تحديث المنطقة' : 'تم إنشاء المنطقة');
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

  const remove = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await deliveryZonesAPI.delete(id);
      toast.success('تم حذف المنطقة');
      void hapticSuccess();
      navigation.goBack();
    } catch (err) {
      const msg = normalizeApiError(err).message;
      setError(msg);
      toast.error(msg);
      void hapticError();
    } finally {
      setBusy(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <FormScreenLayout
      title={id ? 'تعديل منطقة' : 'منطقة جديدة'}
      onBack={navigation.goBack}
      onSave={() => void save()}
      saveLoading={busy}
      onDelete={id ? () => setDeleteConfirm(true) : undefined}
    >
      <FormSection title="بيانات المنطقة" icon="map">
        {error ? <AppInput label="خطأ" value={error} editable={false} /> : null}
        <AppInput label="الاسم" value={name} onChangeText={setName} />
        <AppInput label="رسوم التوصيل" value={fee} onChangeText={setFee} keyboardType="decimal-pad" />
      </FormSection>
      <ConfirmDialog visible={deleteConfirm} title="حذف المنطقة" message="حذف منطقة التوصيل؟" confirmLabel="حذف" onConfirm={() => void remove()} onCancel={() => setDeleteConfirm(false)} loading={busy} />
    </FormScreenLayout>
  );
}
