import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { warehousesAPI } from '@/api/inventory';
import { FormScreenLayout } from '@/components/layout';
import { FormSection , FormError } from '@/components/forms';
import { useToast } from '@/components/feedback';
import { AppInput, AppSelect } from '@/components/ui';
import { AppText as UiText, Text } from '@/components/ui/AppText';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { createInventoryUiStyles } from '@/components/inventory/inventoryUiStyles';
import { useInventoryDirectoryAccess } from '@/hooks/useInventoryDirectoryAccess';
import { textStart } from '@/constants/layout';
import type { Warehouse } from '@/types/api';
import type { MoreStackParamList } from '@/types/navigation';
import { useColors } from '@/hooks/useColors';
import { hapticError, hapticSuccess } from '@/utils/haptics';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'WarehouseForm'>;
type Route = RouteProp<MoreStackParamList, 'WarehouseForm'>;

export function WarehouseFormScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const c = useColors();
  const ui = useMemo(() => createInventoryUiStyles(c), [c]);
  const { canManage } = useInventoryDirectoryAccess();
  const toast = useToast();
  const id = route.params?.id;
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<string>('active');

  const statusOptions = useMemo(
    () => [
      { label: 'نشط', value: 'active' },
      { label: 'غير نشط', value: 'inactive' },
    ],
    [],
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    warehousesAPI
      .get(id)
      .then((res) => {
        const w = extractData<Warehouse>(res);
        if (!w) return;
        setName(w.name);
        setCode(w.code ?? '');
        setLocation(w.location ?? '');
        setStatus(w.status === 'inactive' ? 'inactive' : 'active');
      })
      .catch((err) => setFormError(normalizeApiError(err).message))
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    if (!canManage) return;
    if (name.trim().length < 2) {
      setFormError('اسم المخزن مطلوب');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const payload = {
      name: name.trim(),
      code: code.trim() || undefined,
      location: location.trim() || undefined,
      status,
    };
    try {
      if (isEdit && id) {
        await warehousesAPI.update(id, payload);
        toast.success('تم تحديث المخزن');
        void hapticSuccess();
        navigation.goBack();
      } else {
        const res = await warehousesAPI.create(payload);
        const created = extractData<Warehouse>(res);
        toast.success('تم إنشاء المخزن');
        void hapticSuccess();
        if (created?.id) {
          navigation.replace('WarehouseDetail', { id: created.id, name: created.name });
        } else {
          navigation.navigate('Warehouses');
        }
      }
    } catch (err) {
      const msg = normalizeApiError(err).message;
      setFormError(msg);
      toast.error(msg);
      void hapticError();
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <FormScreenLayout title="المخزن" onBack={navigation.goBack}>
        <UiText style={{ ...textStart, textAlign: 'center', padding: spacing.lg }}>
          الإضافة والتعديل متاحة في الوضع العام فقط (وليس وضع الفرع).
        </UiText>
      </FormScreenLayout>
    );
  }

  return (
    <FormScreenLayout
      title={isEdit ? 'تعديل مخزن' : 'إضافة مخزن'}
      onBack={navigation.goBack}
      heroTitle={isEdit ? 'تعديل مخزن' : 'مخزن جديد'}
      heroSubtitle="يُربط المخزن بالفرع من إعدادات الفرع (المخزن الافتراضي) كما في الويب."
      onSave={() => void save()}
      saveLoading={submitting || loading}
      saveLabel={isEdit ? 'حفظ التعديلات' : 'إنشاء المخزن'}
    >
      {loading ? (
        <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <FormSection title="بيانات المخزن" subtitle="الاسم والكود والموقع" icon="warehouse">
            <AppInput label="اسم المخزن *" value={name} onChangeText={setName} placeholder="مثال: المخزن الرئيسي" />
            <AppInput label="الكود" value={code} onChangeText={setCode} placeholder="يُولَّد تلقائياً إن تُرك فارغاً" />
            <AppInput label="الموقع" value={location} onChangeText={setLocation} placeholder="مثال: الطابق الأرضي" />
            <AppSelect label="الحالة" value={status} options={statusOptions} onChange={setStatus} />
          </FormSection>
          <Text style={ui.formNote}>
            ملاحظة: ربط المخزن بفرع معيّن يتم من شاشة إدارة الفروع على الويب.
          </Text>
          <FormError message={formError} />
        </>
      )}
    </FormScreenLayout>
  );
}
