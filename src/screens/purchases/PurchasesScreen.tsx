import React, { useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { purchasesAPI } from '@/api/purchases';
import { ListScreenLayout, MasterDetailLayout } from '@/components/layout';
import { AppButton } from '@/components/ui';
import { OperationalRow } from '@/components/madar';
import { ResourceList } from '@/components/lists';
import { PurchaseDetail } from '@/screens/purchases/PurchaseDetailScreen';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { isTablet } from '@/constants/responsive';
import { statusTone } from '@/utils/statusTone';
import { dateText, money } from '@/utils/format';
import { spacing } from '@/constants/spacing';

export function PurchasesScreen({ navigation }: { navigation: any }) {
  const { width } = useWindowDimensions();
  const tablet = isTablet(width);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const debounced = useDebouncedValue(query);
  const listParams = useMemo(() => (debounced ? { search: debounced } : {}), [debounced]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Record<string, unknown>>(
    purchasesAPI.getAll,
    listParams,
  );

  const openPurchase = (id: number) => {
    if (tablet) {
      setSelectedId(id);
      return;
    }
    navigation.navigate('PurchaseDetail', { id });
  };

  return (
    <ListScreenLayout
      title="المشتريات"
      subtitle="فواتير الشراء ومرتجعاتها"
      noHeader
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="بحث برقم الفاتورة أو المورد..."
      onRefresh={refresh}
      refreshing={refreshing}
      contentStyle={tablet ? { flex: 1 } : undefined}
      fab={{ onPress: () => navigation.navigate('CreatePurchase'), label: 'إنشاء شراء' }}
      headerRight={
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          <AppButton title="مرتجعات" variant="secondary" size="sm" onPress={() => navigation.navigate('PurchaseReturnsList')} />
        </View>
      }
      hero={{
        eyebrow: 'المشتريات',
        title: 'المشتريات',
        subtitle: 'فواتير الشراء ومرتجعاتها',
        stats: [{ label: 'فواتير ظاهرة', value: items.length }],
        compact: true,
      }}
    >
      <MasterDetailLayout
        emptyTitle="اختر فاتورة شراء"
        emptyMessage="اختر فاتورة من القائمة لمراجعة الأصناف والمدفوعات دون مغادرة الشاشة."
        master={
          <ResourceList
            data={items}
            loading={loading}
            refreshing={refreshing}
            error={error}
            onRefresh={refresh}
            onEndReached={loadMore}
            emptyTitle="لا توجد مشتريات"
            emptyCtaLabel="إنشاء شراء"
            onEmptyCta={() => navigation.navigate('CreatePurchase')}
            keyExtractor={(item, index) => `purchase-${String(item.id ?? index)}`}
            renderItem={({ item }) => {
              const id = Number(item.id);
              return (
                <OperationalRow
                  primary={String(item.invoice_number ?? item.reference_no ?? `شراء ${item.id}`)}
                  secondary={`${dateText(String(item.purchase_date ?? item.created_at ?? ''))} · ${String((item.supplier as { name?: string } | undefined)?.name ?? item.supplier_name ?? 'مورد')}`}
                  amount={Number(item.total ?? item.subtotal ?? 0)}
                  currency="ج.م"
                  statusLabel={String(item.status ?? '—')}
                  statusTone={statusTone(item.status)}
                  selected={tablet && selectedId === id}
                  onPress={() => openPurchase(id)}
                />
              );
            }}
          />
        }
        detail={
          selectedId != null ? (
            <PurchaseDetail
              key={selectedId}
              id={selectedId}
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
