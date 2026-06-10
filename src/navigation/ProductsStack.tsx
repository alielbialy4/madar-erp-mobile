import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProductFormProvider } from '@/components/products/ProductFormContext';
import { ProductsScreen } from '@/screens/products/ProductsScreen';
import { ProductDetailScreen } from '@/screens/products/ProductDetailScreen';
import { ProductFormScreen } from '@/screens/products/ProductFormScreen';
import { ProductFormRecipeScreen } from '@/screens/products/ProductFormRecipeScreen';
import { ProductFormModifiersScreen } from '@/screens/products/ProductFormModifiersScreen';
import { ProductInsightsScreen } from '@/screens/products/ProductInsightsScreen';
import { CategoriesScreen } from '@/screens/products/CategoriesScreen';
import { CategoryDetailScreen } from '@/screens/products/CategoryDetailScreen';
import { CategoryFormScreen } from '@/screens/products/CategoryFormScreen';
import { CategoriesReorderScreen } from '@/screens/products/CategoriesReorderScreen';
import { ProductsReorderScreen } from '@/screens/products/ProductsReorderScreen';
import type { ProductsStackParamList } from '@/types/navigation';
import { rtlStackScreenOptions } from './rtlScreenOptions';

const Stack = createNativeStackNavigator<ProductsStackParamList>();

export function ProductsStack() {
  return (
    <ProductFormProvider>
      <Stack.Navigator screenOptions={rtlStackScreenOptions}>
        <Stack.Screen name="ProductsHome" component={ProductsScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="ProductForm" component={ProductFormScreen} />
        <Stack.Screen name="ProductFormRecipe" component={ProductFormRecipeScreen} options={{ title: 'الوصفة' }} />
        <Stack.Screen name="ProductFormModifiers" component={ProductFormModifiersScreen} options={{ title: 'الموديفايرز' }} />
        <Stack.Screen name="ProductInsights" component={ProductInsightsScreen} />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
        <Stack.Screen name="CategoryForm" component={CategoryFormScreen} />
        <Stack.Screen name="CategoriesReorder" component={CategoriesReorderScreen} />
        <Stack.Screen name="ProductsReorder" component={ProductsReorderScreen} />
      </Stack.Navigator>
    </ProductFormProvider>
  );
}
