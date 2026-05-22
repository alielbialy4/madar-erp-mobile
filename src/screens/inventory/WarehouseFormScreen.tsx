import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { warehousesAPI } from '@/api/inventory';
import { AppScreen } from '@/components/layout';
import { InventoryHero } from '@/components/inventory/InventoryHero';
import { ProductFormSection } from '@/components/products/ProductFormSection';
import { FormError } from '@/components/forms';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { AppText as UiText } from '@/components/ui/AppText';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { createInventoryUiStyles } from '@/components/inventory/inventoryUiStyles';
import { useInventoryDirectoryAccess } from '@/hooks/useInventoryDirectoryAccess';
import { textStart } from '@/constants/layout';
import type { Warehouse } from '@/types/api';
import type { MoreStackParamList } from '@/types/navigation';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'WarehouseForm'>;
type Route = RouteProp<MoreStackParamList, 'WarehouseForm'>;

export function WarehouseFormScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const c = useColors();
  const ui = useMemo(() => createInventoryUiStyles(c), [c]);
  const { canManage } = useInventoryDirectoryAccess();
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
      if (isEdit && id) await warehousesAPI.update(id, payload);
      else await warehousesAPI.create(payload);
      navigation.goBack();
    } catch (err) {
      setFormError(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <AppScreen title="المخزن" onBack={navigation.goBack}>
        <UiText style={{ ...textStart, textAlign: 'center', padding: spacing.lg }}>
          الإضافة والتعديل متاحة في الوضع العام فقط (وليس وضع الفرع).
        </UiText>
      </AppScreen>
    );
  }

  return (
    <AppScreen title={isEdit ? 'تعديل مخزن' : 'إضافة مخزن'} onBack={navigation.goBack} scroll contentStyle={{ padding: 0 }}>
      {loading ? (
        <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <InventoryHero
              eyebrow={isEdit ? 'تعديل' : 'إنشاء'}
              title={isEdit ? 'تعديل مخزن' : 'مخزن جديد'}
              subtitle="يُربط المخزن بالفرع من إعدادات الفرع (المخزن الافتراضي) كما في الويب."
            />
          </View>

          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: spacing.md }}>
            <ProductFormSection title="بيانات المخزن" subtitle="الاسم والكود والموقع" icon="warehouse">
              <AppInput label="اسم المخزن *" value={name} onChangeText={setName} placeholder="مثال: المخزن الرئيسي" />
              <AppInput label="الكود" value={code} onChangeText={setCode} placeholder="يُولَّد تلقائياً إن تُرك فارغاً" />
              <AppInput label="الموقع" value={location} onChangeText={setLocation} placeholder="مثال: الطابق الأرضي" />
              <AppSelect label="الحالة" value={status} options={statusOptions} onChange={setStatus} />
            </ProductFormSection>

            <Text style={ui.formNote}>
              ملاحظة: ربط المخزن بفرع معيّن يتم من شاشة إدارة الفروع على الويب.
            </Text>

            <FormError message={formError} />
            <AppButton title={isEdit ? 'حفظ التعديلات' : 'إنشاء المخزن'} onPress={() => void save()} loading={submitting} />
          </View>
        </ScrollView>
      )}
    </AppScreen>
  );
}
