import React, { useEffect, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { categoriesAPI } from '@/api/categories';
import type { CategoryPayload } from '@/api/categories';
import { AppScreen } from '@/components/layout';
import { ConfirmDialog } from '@/components/feedback';
import { ImagePickerField } from '@/components/forms/ImagePickerField';
import { FormError } from '@/components/forms';
import { AppButton, AppInput } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';
import { useAuthStore } from '@/store/authStore';
import type { Category } from '@/types/api';
import type { ProductsStackParamList } from '@/types/navigation';
import { useColors } from '@/hooks/useColors';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'CategoryForm'>;
type Route = RouteProp<ProductsStackParamList, 'CategoryForm'>;

export function CategoryFormScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const c = useColors();
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
      if (isEdit && id) await categoriesAPI.update(id, payload());
      else await categoriesAPI.create(payload());
      navigation.goBack();
    } catch (err) {
      setFormError(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await categoriesAPI.delete(id);
      navigation.goBack();
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
      setDeleteOpen(false);
    }
  };

  if (!canManage) {
    return (
      <AppScreen title="التصنيف" onBack={navigation.goBack}>
        <Text style={{ color: c.textMuted, textAlign: 'center' }}>ليس لديك صلاحية إدارة التصنيفات</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title={isEdit ? 'تعديل تصنيف' : 'إضافة تصنيف'}
      onBack={navigation.goBack}
      scroll
    >
      <View style={{ gap: 14, padding: 16 }}>
        <ImagePickerField label="الصورة" value={image} remoteUrl={remoteImage} onChange={setImage} />
        <AppInput label="الاسم" value={name} onChangeText={setName} />
        <AppInput label="الوصف" value={description} onChangeText={setDescription} multiline />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: c.text }}>نشط</Text>
          <Switch value={active} onValueChange={setActive} />
        </View>
        <FormError message={formError} />
        <AppButton title="حفظ" onPress={() => void save()} loading={submitting || loading} />
        {isEdit ? <AppButton title="حذف التصنيف" variant="danger" onPress={() => setDeleteOpen(true)} /> : null}
      </View>
      <ConfirmDialog
        visible={deleteOpen}
        title="حذف التصنيف"
        message="هل أنت متأكد من الحذف؟"
        loading={submitting}
        onConfirm={() => void remove()}
        onCancel={() => setDeleteOpen(false)}
      />
    </AppScreen>
  );
}
