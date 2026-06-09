import React from 'react';
import { View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FormScreenLayout } from '@/components/layout';
import { ProductRecipeBuilder } from '@/components/products/ProductRecipeBuilder';
import { useProductFormContext } from '@/components/products/ProductFormContext';
import type { ProductsStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductFormRecipe'>;

export function ProductFormRecipeScreen({ navigation }: { navigation: Nav }) {
  const form = useProductFormContext();

  return (
    <FormScreenLayout
      title="مكونات الوصفة"
      subtitle="مكونات الخصم عند البيع"
      onBack={navigation.goBack}
      onSave={navigation.goBack}
      saveLabel="تم"
    >
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}>
        <ProductRecipeBuilder
          recipes={form.recipes}
          onChange={form.setRecipes}
          warehouses={form.warehouses}
          productVariants={form.productVariants}
          optionGroups={form.optionGroups}
          currentProductId={form.productId}
          recipeCostPreview={form.recipeCostPreview}
          onAddRawMaterial={() => navigation.push('ProductForm', { mode: 'raw_material' })}
        />
      </View>
    </FormScreenLayout>
  );
}
