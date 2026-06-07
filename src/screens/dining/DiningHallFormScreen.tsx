import React, { useState } from 'react';
import { diningAPI } from '@/api/dining';
import { FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { AppInput } from '@/components/ui';
import { useBranchStore } from '@/store/branchStore';
import { normalizeApiError } from '@/utils/errors';
import { hapticError, hapticSuccess } from '@/utils/haptics';

export function DiningHallFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = route.params?.id as string | undefined;
  const branch = useBranchStore((s) => s.activeBranch);
  const toast = useToast();
  const [name, setName] = useState(route.params?.name ?? '');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const save = async () => {
    if (!branch?.id || !name.trim()) {
      setError('اسم القاعة والفرع مطلوبان');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (id) {
        await diningAPI.updateHall(id, { name: name.trim(), description: description.trim() || null, is_active: true });
      } else {
        await diningAPI.createHall(branch.id, { name: name.trim(), description: description.trim() || null, is_active: true });
      }
      toast.success(id ? 'تم تحديث القاعة' : 'تم إنشاء القاعة');
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
      await diningAPI.deleteHall(id);
      toast.success('تم حذف القاعة');
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
      title={id ? 'تعديل قاعة' : 'قاعة جديدة'}
      onBack={navigation.goBack}
      onSave={() => void save()}
      saveLoading={busy}
      onDelete={id ? () => setDeleteConfirm(true) : undefined}
    >
      <FormSection title="بيانات القاعة" icon="restaurant">
        {error ? <AppInput label="خطأ" value={error} editable={false} /> : null}
        <AppInput label="اسم القاعة" value={name} onChangeText={setName} />
        <AppInput label="وصف (اختياري)" value={description} onChangeText={setDescription} />
      </FormSection>
      <ConfirmDialog
        visible={deleteConfirm}
        title="حذف القاعة"
        message="سيتم حذف القاعة. تأكد أنه لا توجد طاولات نشطة مرتبطة."
        confirmLabel="حذف"
        onConfirm={() => void remove()}
        onCancel={() => setDeleteConfirm(false)}
        loading={busy}
      />
    </FormScreenLayout>
  );
}
