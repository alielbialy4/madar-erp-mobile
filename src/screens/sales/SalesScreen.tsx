import React, { useMemo, useState } from 'react';
import { salesAPI } from '@/api/sales';
import { ListScreenLayout } from '@/components/layout/ListScreenLayout';
import { ResourceList } from '@/components/lists';
import { SaleInvoiceCard } from '@/components/sales/SaleInvoiceCard';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { money } from '@/utils/format';
import type { Sale } from '@/types/api';

function amount(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function isCompletedStatus(status: string | null | undefined): boolean {
  const key = String(status ?? '').trim().toLowerCase();
  return key === 'completed' || key === 'complete';
}

export function SalesScreen({ navigation }: { navigation: { navigate: (a: string, b?: object) => void } }) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const listParams = useMemo(() => (debounced ? { search: debounced } : {}), [debounced]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Sale & Record<string, unknown>>(
    salesAPI.getAll,
    listParams,
  );

  const heroStats = useMemo(() => {
    let completed = 0;
    let pageTotal = 0;
    for (const item of items) {
      if (isCompletedStatus(item.status)) completed += 1;
      pageTotal += amount(item.total);
    }
    return [
      { label: 'الفواتير', value: items.length },
      { label: 'مكتملة', value: completed, tone: 'success' as const },
      { label: 'إجمالي الصفحة', value: money(pageTotal), tone: 'default' as const },
    ];
  }, [items]);

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
        stats: heroStats,
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
          return (
            <SaleInvoiceCard
              sale={sale}
              onPress={() => navigation.navigate('SaleDetail', { id: sale.id, invoice: sale.invoice_number })}
            />
          );
        }}
      />
    </ListScreenLayout>
  );
}
