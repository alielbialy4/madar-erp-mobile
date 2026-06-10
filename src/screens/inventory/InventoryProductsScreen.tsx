import React, { useCallback, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { inventoryAPI } from '@/api/inventory';
import { InventoryHero } from '@/components/inventory/InventoryHero';
import { InventoryListShell } from '@/components/inventory/InventoryListShell';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'InventoryProducts'>;

export function InventoryProductsScreen({ navigation }: { navigation: Nav }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const [listItems, setListItems] = useState<Record<string, unknown>[]>([]);
  const [refreshingHero, setRefreshingHero] = useState(false);
  const [shellKey, setShellKey] = useState(0);

  const lowCount = useMemo(
    () => listItems.filter((r) => r.status === 'low' || r.status === 'out').length,
    [listItems],
  );

  const hero = (
    <InventoryHero
      eyebrow="المخزون"
      title="منتجات المخزون"
      subtitle="عرض المنتجات حسب المخزن وحالة المخزون — كما في لوحة الويب."
      stats={[
        { label: 'منتجات', value: listItems.length },
        { label: 'تنبيه', value: lowCount, tone: 'warning' },
      ]}
      metaLabel={`${listItems.length} منتج`}
      isLoading={refreshingHero}
      onRefresh={() => {
        setRefreshingHero(true);
        setShellKey((k) => k + 1);
        setTimeout(() => setRefreshingHero(false), 400);
      }}
      statsOnly={!isTablet}
      compact
    />
  );

  const openItem = useCallback(
    (item: Record<string, unknown>) => {
      navigation.navigate('StockBalanceDetail', {
        product_id: Number(item.product_id ?? item.id),
        warehouse_id: String(item.warehouse_id ?? ''),
        product_name: String(item.name ?? item.product_name ?? ''),
      });
    },
    [navigation],
  );

  return (
    <InventoryListShell
      key={`inv-products-${shellKey}`}
      title="منتجات المخزون"
      onBack={navigation.goBack}
      surface="products"
      loader={(params) =>
        inventoryAPI.products(params) as Promise<import('@/types/api').ApiEnvelope<Record<string, unknown>[]>>
      }
      searchParam="search"
      searchPlaceholder="بحث بالاسم أو الباركود..."
      supportedFilters={['warehouse_id', 'stock_status']}
      listHeader={hero}
      emptyTitle="لا توجد منتجات"
      emptyMessage="غيّر المخزن أو حالة المخزون للبحث."
      onItemsChange={setListItems}
      layout="table"
      onItemPress={openItem}
    />
  );
}
