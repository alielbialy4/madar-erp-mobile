import React, { useState } from 'react';
import { View } from 'react-native';
import { diningAPI } from '@/api/dining';
import { AppScreen } from '@/components/layout';
import { ConfirmDialog } from '@/components/feedback';
import { AppButton, AppInput } from '@/components/ui';
import { useBranchStore } from '@/store/branchStore';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';

export function DiningHallFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = route.params?.id as string | undefined;
  const branch = useBranchStore((s) => s.activeBranch);
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
      await diningAPI.deleteHall(id);
      navigation.goBack();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <AppScreen title={id ? 'تعديل قاعة' : 'قاعة جديدة'} onBack={navigation.goBack}>
      <View style={{ gap: spacing.md }}>
        {error ? <AppInput label="خطأ" value={error} editable={false} /> : null}
        <AppInput label="اسم القاعة" value={name} onChangeText={setName} />
        <AppInput label="وصف (اختياري)" value={description} onChangeText={setDescription} />
        <AppButton title="حفظ" onPress={() => void save()} loading={busy} />
        {id ? <AppButton title="حذف القاعة" variant="ghost" onPress={() => setDeleteConfirm(true)} /> : null}
      </View>
      <ConfirmDialog
        visible={deleteConfirm}
        title="حذف القاعة"
        message="سيتم حذف القاعة. تأكد أنه لا توجد طاولات نشطة مرتبطة."
        confirmLabel="حذف"
        onConfirm={() => void remove()}
        onCancel={() => setDeleteConfirm(false)}
        loading={busy}
      />
    </AppScreen>
  );
}
