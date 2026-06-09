import React from 'react';
import { View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FormScreenLayout } from '@/components/layout';
import { ProductOptionGroupsEditor } from '@/components/products/ProductOptionGroupsEditor';
import { useProductFormContext } from '@/components/products/ProductFormContext';
import type { ProductsStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductFormModifiers'>;

export function ProductFormModifiersScreen({ navigation }: { navigation: Nav }) {
  const form = useProductFormContext();

  return (
    <FormScreenLayout
      title="مجموعات الخيارات"
      subtitle="موديفايرز نقطة البيع"
      onBack={navigation.goBack}
      onSave={navigation.goBack}
      saveLabel="تم"
    >
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}>
        <ProductOptionGroupsEditor value={form.optionGroups} onChange={form.setOptionGroups} />
      </View>
    </FormScreenLayout>
  );
}
