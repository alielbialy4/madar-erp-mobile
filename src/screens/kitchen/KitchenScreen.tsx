import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { kitchenAPI } from '@/api/kitchen';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppInput, AppListItem, AppSelect } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import type { KitchenOrder } from '@/types/api';
import { dateText, numberText } from '@/utils/format';

export function KitchenScreen({ navigation }: { navigation: any }) {
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const params = useMemo(() => ({ ...(status ? { status } : {}), ...(debounced ? { search: debounced } : {}), per_page: 30 }), [debounced, status]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<KitchenOrder & Record<string, unknown>>(kitchenAPI.getOrders, params);

  return (
    <AppScreen title="شاشة المطبخ" subtitle="طلبات وتحضير وتحديث حالة" scroll={false}>
      <View style={{ padding: 16, gap: 12 }}>
        <AppInput value={query} onChangeText={setQuery} placeholder="بحث برقم الفاتورة..." />
        <AppSelect
          label="الحالة"
          value={status}
          onChange={setStatus}
          options={[
            { label: 'الكل', value: '' },
            { label: 'قيد الانتظار', value: 'pending' },
            { label: 'قيد التحضير', value: 'preparing' },
            { label: 'جاهز', value: 'ready' },
            { label: 'تم التقديم', value: 'served' },
          ]}
        />
      </View>
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا توجد طلبات مطبخ"
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AppListItem
            title={item.invoice_number || `طلب ${item.id}`}
            subtitle={`${dateText(item.created_at)} • ${item.order_type ?? '—'}`}
            meta={`الأصناف: ${numberText(item.items?.length ?? 0)} • انتظار: ${numberText(item.wait_time ?? 0)} دقيقة`}
            badge={<AppBadge label={String(item.kitchen_status ?? item.status ?? 'pending')} tone={item.is_overdue ? 'danger' : item.kitchen_status === 'ready' ? 'success' : 'warning'} />}
            onPress={() => navigation.navigate('KitchenOrder', { id: item.id })}
          />
        )}
      />
    </AppScreen>
  );
}
