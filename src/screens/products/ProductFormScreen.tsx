import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { FormScreenLayout } from '@/components/layout';
import { ProductFormFields } from '@/components/products/ProductFormFields';
import type { ProductFormSectionKey } from '@/components/products/ProductFormContext';
import { useRegisterProductForm } from '@/components/products/ProductFormContext';
import { useProductForm } from '@/hooks/useProductForm';
import { hasPermission } from '@/utils/permissions';
import { useAuthStore } from '@/store/authStore';
import type { ProductsStackParamList } from '@/types/navigation';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { AppText as UiText } from '@/components/ui/AppText';
import { hapticError } from '@/utils/haptics';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductForm'>;
type Route = RouteProp<ProductsStackParamList, 'ProductForm'>;

function defaultExpanded(rawMaterial: boolean): Partial<Record<ProductFormSectionKey, boolean>> {
  return {
    basics: true,
    pricing: true,
    inventory: true,
    rawDetails: rawMaterial,
    advanced: false,
    extra: false,
  };
}

export function ProductFormScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_products');
  const id = route.params?.id;
  const isRawMaterial = route.params?.mode === 'raw_material';

  const form = useProductForm({
    id,
    initialRawMaterial: isRawMaterial,
  });

  useRegisterProductForm(form);

  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const sectionRefs = useRef<Partial<Record<ProductFormSectionKey, View | null>>>({});
  const [expandedSections, setExpandedSections] = useState(() => defaultExpanded(isRawMaterial));

  const scrollToSection = useCallback((key: ProductFormSectionKey) => {
    const section = sectionRefs.current[key];
    const container = contentRef.current;
    if (!section || !container || !scrollRef.current) return;
    section.measureLayout(
      container,
      (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true }),
      () => {},
    );
  }, []);

  const onSectionExpandedChange = useCallback((key: ProductFormSectionKey, expanded: boolean) => {
    setExpandedSections((prev) => ({ ...prev, [key]: expanded }));
  }, []);

  const title = useMemo(() => {
    if (form.rawMaterialMode) return form.isEdit ? 'تعديل خامة' : 'إضافة خامة';
    return form.isEdit ? 'تعديل منتج' : 'إضافة منتج';
  }, [form.rawMaterialMode, form.isEdit]);

  if (!canManage) {
    return (
      <FormScreenLayout title="المنتج" onBack={navigation.goBack}>
        <UiText style={{ color: c.textMuted, textAlign: 'center' }}>ليس لديك صلاحية إدارة المنتجات</UiText>
      </FormScreenLayout>
    );
  }

  const saveLabel = form.isEdit
    ? 'حفظ التعديلات'
    : form.rawMaterialMode
      ? 'إنشاء الخامة'
      : 'إنشاء المنتج';

  const handleSave = async () => {
    const err = await form.save();
    if (err) {
      void hapticError();
      setExpandedSections((prev) => ({ ...prev, [err.sectionKey]: true }));
      requestAnimationFrame(() => scrollToSection(err.sectionKey));
      return;
    }
    navigation.goBack();
  };

  return (
    <FormScreenLayout
      title={title}
      onBack={navigation.goBack}
      onSave={() => void handleSave()}
      saveLoading={form.submitting}
      saveLabel={saveLabel}
      scrollRef={scrollRef}
    >
      {form.loading ? (
        <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
          <ActivityIndicator color={c.accent} />
        </View>
      ) : (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, paddingTop: spacing.sm }}>
          <ProductFormFields
            form={form}
            navigation={navigation}
            contentRef={contentRef}
            sectionRefs={sectionRefs}
            expandedSections={expandedSections}
            onSectionExpandedChange={onSectionExpandedChange}
          />
        </View>
      )}
    </FormScreenLayout>
  );
}
