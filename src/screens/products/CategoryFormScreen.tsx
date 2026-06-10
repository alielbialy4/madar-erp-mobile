import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { categoriesAPI } from '@/api/categories';
import type { CategoryPayload } from '@/api/categories';
import { FormScreenLayout } from '@/components/layout';
import { FormSection, SwitchRow } from '@/components/forms';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { ImagePickerField } from '@/components/forms/ImagePickerField';
import { FormError } from '@/components/forms';
import { AppInput } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';
import { useAuthStore } from '@/store/authStore';
import type { Category } from '@/types/api';
import type { ProductsStackParamList } from '@/types/navigation';
import { hapticError, hapticSuccess } from '@/utils/haptics';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'CategoryForm'>;
type Route = RouteProp<ProductsStackParamList, 'CategoryForm'>;

export function CategoryFormScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_categories');
  const id = route.params?.id;
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [image, setImage] = useState<CategoryPayload['image']>(null);
  const [remoteImage, setRemoteImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    categoriesAPI
      .getById(id)
      .then((res) => {
        const cat = extractData<Category>(res);
        if (!cat) return;
        setName(cat.name);
        setDescription(cat.description ?? '');
        setActive(cat.active !== false);
        setRemoteImage(cat.image ?? null);
      })
      .catch((err) => setFormError(normalizeApiError(err).message))
      .finally(() => setLoading(false));
  }, [id]);

  const payload = (): CategoryPayload => ({
    name: name.trim(),
    description: description.trim() || undefined,
    active,
    image,
  });

  const save = async () => {
    if (!canManage) return;
    if (name.trim().length < 2) {
      setFormError('اسم التصنيف مطلوب');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit && id) {
        await categoriesAPI.update(id, payload());
        toast.success('تم تحديث التصنيف');
        void hapticSuccess();
        navigation.goBack();
      } else {
        const res = await categoriesAPI.create(payload());
        const created = extractData<Category>(res);
        toast.success('تم إنشاء التصنيف');
        void hapticSuccess();
        if (created?.id) {
          navigation.replace('CategoryDetail', { id: created.id, name: created.name });
        } else {
          navigation.navigate('Categories');
        }
      }
    } catch (err) {
      setFormError(normalizeApiError(err).message);
      toast.error(normalizeApiError(err).message);
      void hapticError();
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await categoriesAPI.delete(id);
      toast.success('تم حذف التصنيف');
      void hapticSuccess();
      navigation.navigate('Categories');
    } catch (err) {
      const message = normalizeApiError(err).message;
      toast.error(message);
      Alert.alert('خطأ', message);
    } finally {
      setSubmitting(false);
      setDeleteOpen(false);
    }
  };

  if (!canManage) {
    return (
      <FormScreenLayout title="التصنيف" onBack={navigation.goBack}>
        <Text style={{ textAlign: 'center' }}>ليس لديك صلاحية إدارة التصنيفات</Text>
      </FormScreenLayout>
    );
  }

  return (
    <FormScreenLayout
      title={isEdit ? 'تعديل تصنيف' : 'إضافة تصنيف'}
      onBack={navigation.goBack}
      onSave={() => void save()}
      saveLoading={submitting || loading}
      onDelete={isEdit ? () => setDeleteOpen(true) : undefined}
    >
      <FormSection title="بيانات التصنيف" icon="category">
        <ImagePickerField label="الصورة" value={image} remoteUrl={remoteImage} onChange={setImage} />
        <AppInput label="الاسم" value={name} onChangeText={setName} />
        <AppInput label="الوصف" value={description} onChangeText={setDescription} multiline />
        <SwitchRow label="نشط" value={active} onValueChange={setActive} />
        <FormError message={formError} />
      </FormSection>
      <ConfirmDialog
        visible={deleteOpen}
        title="حذف التصنيف"
        message="هل أنت متأكد من الحذف؟"
        loading={submitting}
        onConfirm={() => void remove()}
        onCancel={() => setDeleteOpen(false)}
      />
    </FormScreenLayout>
  );
}
