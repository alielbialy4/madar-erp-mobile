import React, { useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { salesAPI } from '@/api/sales';
import { ListScreenLayout, MasterDetailLayout } from '@/components/layout';
import { ResourceList } from '@/components/lists';
import { SaleInvoiceCard } from '@/components/sales/SaleInvoiceCard';
import { SaleDetail } from '@/screens/sales/SaleDetailScreen';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { isTablet } from '@/constants/responsive';
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
  const { width } = useWindowDimensions();
  const tablet = isTablet(width);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string | undefined>();
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

  const openSale = (sale: Sale) => {
    if (tablet) {
      setSelectedId(Number(sale.id));
      setSelectedInvoice(sale.invoice_number ?? undefined);
      return;
    }
    navigation.navigate('SaleDetail', { id: sale.id, invoice: sale.invoice_number });
  };

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
      contentStyle={tablet ? { flex: 1 } : undefined}
      hero={{
        eyebrow: 'الإيرادات',
        title: 'المبيعات',
        subtitle: 'فواتير، حالات الدفع، وتفاصيل العملاء',
        stats: heroStats,
        compact: true,
      }}
    >
      <MasterDetailLayout
        emptyTitle="اختر فاتورة"
        emptyMessage="اختر فاتورة من القائمة لمراجعة الأصناف والمدفوعات دون مغادرة الشاشة."
        master={
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
                  selected={tablet && selectedId === Number(sale.id)}
                  onPress={() => openSale(sale)}
                />
              );
            }}
          />
        }
        detail={
          selectedId != null ? (
            <SaleDetail
              key={selectedId}
              id={selectedId}
              invoice={selectedInvoice}
              navigation={navigation}
              embedded
              onBack={() => setSelectedId(null)}
            />
          ) : null
        }
      />
    </ListScreenLayout>
  );
}
