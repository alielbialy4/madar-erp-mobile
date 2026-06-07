import React, { useMemo, useState } from 'react';
import { salesAPI } from '@/api/sales';
import { ListScreenLayout } from '@/components/layout/ListScreenLayout';
import { ResourceList } from '@/components/lists';
import { SaleInvoiceCard } from '@/components/sales/SaleInvoiceCard';
import { statusTone } from '@/utils/statusTone';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import type { Sale } from '@/types/api';

export function SalesScreen({ navigation }: { navigation: { navigate: (a: string, b?: object) => void } }) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const listParams = useMemo(() => (debounced ? { search: debounced } : {}), [debounced]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Sale & Record<string, unknown>>(
    salesAPI.getAll,
    listParams,
  );

  return (
    <ListScreenLayout
      title="المبيعات"
      subtitle="فواتير، حالات الدفع، وتفاصيل العملاء"
      noHeader
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="بحث برقم الفاتورة أو العميل..."
      onRefresh={refresh}
      refreshing={refreshing}
      hero={{
        eyebrow: 'الإيرادات',
        title: 'المبيعات',
        subtitle: 'فواتير، حالات الدفع، وتفاصيل العملاء',
        stats: [{ label: 'الفواتير', value: items.length }],
        compact: true,
      }}
    >
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا توجد مبيعات"
        keyExtractor={(item, index) => `sale-${String(item.id ?? index)}-${index}`}
        renderItem={({ item }) => {
          const sale = item as Sale;
          const badge = { label: sale.status ?? '—', tone: statusTone(sale.status) };
          return (
            <SaleInvoiceCard
              sale={sale}
              badge={badge}
              onPress={() => navigation.navigate('SaleDetail', { id: sale.id, invoice: sale.invoice_number })}
            />
          );
        }}
      />
    </ListScreenLayout>
  );
}
