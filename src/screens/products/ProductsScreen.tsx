import React from 'react';
import { productsAPI } from '@/api/products';
import { AppButton } from '@/components/ui';
import { CrudListScreen, statusTone } from '@/screens/shared/CrudListScreen';
import type { Product } from '@/types/api';
import { money, numberText } from '@/utils/format';

export function ProductsScreen({ navigation }: { navigation: any }) {
  return (
    <CrudListScreen<Product & Record<string, unknown>>
      title="المنتجات"
      subtitle="قائمة المنتجات حسب سياق الفرع"
      loader={productsAPI.getAll}
      searchParam="search"
      headerRight={<AppButton title="التصنيفات" variant="secondary" onPress={() => navigation.navigate('Categories')} />}
      onItemPress={(item) => navigation.navigate('ProductDetail', { id: item.id, name: item.name })}
      itemTitle={(item) => item.name}
      itemSubtitle={(item) => `${item.category?.name ?? 'بدون تصنيف'} • ${money(item.selling_price ?? 0)}`}
      itemMeta={(item) => `SKU/Barcode: ${item.barcode ?? '—'} • المتاح: ${numberText(item.branch_available_quantity ?? item.available_quantity ?? item.stock_quantity ?? 0)}`}
      itemBadge={(item) => ({ label: item.track_inventory === false ? 'خدمة' : 'مخزون', tone: statusTone(item.track_inventory === false ? 'info' : 'active') })}
      emptyTitle="لا توجد منتجات"
      noHeader
    />
  );
}
