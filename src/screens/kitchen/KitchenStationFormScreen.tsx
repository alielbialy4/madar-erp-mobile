import React, { useEffect, useState } from 'react';
import { kitchenStationsAPI } from '@/api/kitchenStations';
import { FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { AppInput } from '@/components/ui';
import { useBranchStore } from '@/store/branchStore';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hapticError, hapticSuccess } from '@/utils/haptics';

export function KitchenStationFormScreen({ route, navigation }: { navigation: any; route: any }) {
  const id = route.params?.id as string | undefined;
  const branch = useBranchStore((s) => s.activeBranch);
  const toast = useToast();
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
      toast.success(id ? 'تم تحديث المحطة' : 'تم إنشاء المحطة');
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
      await kitchenStationsAPI.remove(id);
      toast.success('تم حذف المحطة');
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
      title={id ? 'تعديل محطة' : 'محطة جديدة'}
      onBack={navigation.goBack}
      onSave={() => void save()}
      saveLoading={busy}
      onDelete={id ? () => setDeleteConfirm(true) : undefined}
    >
      <FormSection title="بيانات المحطة" icon="restaurant">
        {error ? <AppInput label="خطأ" value={error} editable={false} /> : null}
        <AppInput label="الاسم" value={name} onChangeText={setName} />
        <AppInput label="الرمز" value={code} onChangeText={setCode} />
      </FormSection>
      <ConfirmDialog visible={deleteConfirm} title="حذف المحطة" message="حذف محطة المطبخ؟" confirmLabel="حذف" onConfirm={() => void remove()} onCancel={() => setDeleteConfirm(false)} loading={busy} />
    </FormScreenLayout>
  );
}
