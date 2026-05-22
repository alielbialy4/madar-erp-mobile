import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProductsScreen } from '@/screens/products/ProductsScreen';
import { ProductDetailScreen } from '@/screens/products/ProductDetailScreen';
import { CategoriesScreen } from '@/screens/products/CategoriesScreen';
import type { ProductsStackParamList } from '@/types/navigation';
import { rtlStackScreenOptions } from './rtlScreenOptions';

const Stack = createNativeStackNavigator<ProductsStackParamList>();

export function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={rtlStackScreenOptions}>
      <Stack.Screen name="ProductsHome" component={ProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
    </Stack.Navigator>
  );
}
