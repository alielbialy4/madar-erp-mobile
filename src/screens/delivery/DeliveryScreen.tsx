import React, { useMemo, useState } from 'react';
import type { ListParams } from '@/types/api';
import { ListScreenLayout } from '@/components/layout';
import { AppButton, AppDomainCard, AppSelect } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { deliveriesAPI } from '@/api/deliveries';
import { deliveryStatusLabel, deliveryStatusTone } from '@/utils/deliveryStatus';
import { moduleIcons } from '@/constants/iconMap';
import { asText, dateText, money } from '@/utils/format';

export function DeliveryScreen({ navigation }: { navigation: any }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const debounced = useDebouncedValue(query);
  const params: ListParams = useMemo(
    () => ({ ...(debounced ? { search: debounced } : {}), ...(status ? { status } : {}), per_page: 40 }),
    [debounced, status],
  );
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Record<string, unknown>>(
    (p) => deliveriesAPI.getAll(p) as never,
    params,
  );

  return (
    <ListScreenLayout
      title="التوصيل"
      subtitle="طلبات وسائقون ومناطق ومالية"
      searchValue={query}
      onSearchChange={setQuery}
      onRefresh={refresh}
      refreshing={refreshing}
      filters={
        <AppSelect
          label="الحالة"
          value={status || null}
          onChange={(v) => setStatus(v ?? '')}
          options={[
            { label: 'الكل', value: '' },
            { label: 'قيد الانتظار', value: 'pending' },
            { label: 'تم التعيين', value: 'assigned' },
            { label: 'في الطريق', value: 'in_transit' },
            { label: 'تم التوصيل', value: 'delivered' },
            { label: 'فشل', value: 'failed' },
          ]}
        />
      }
      hero={{
        eyebrow: 'العمليات',
        title: 'التوصيل',
        subtitle: 'طلبات وسائقون ومناطق ومالية',
        stats: [{ label: 'الطلبات', value: items.length }],
        actions: (
          <>
            <AppButton title="السائقون" variant="secondary" onPress={() => navigation.navigate('DriversList')} />
            <AppButton title="المناطق" variant="secondary" onPress={() => navigation.navigate('DeliveryZonesList')} />
            <AppButton title="تسويات السائقين" variant="secondary" onPress={() => navigation.navigate('DriverSettlements')} />
            <AppButton title="مالية التوصيل" variant="secondary" onPress={() => navigation.navigate('DeliveryFinanceDashboard')} />
          </>
        ),
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
        emptyTitle="لا توجد طلبات توصيل"
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={({ item }) => {
          const st = String(item.status ?? '');
          return (
            <AppDomainCard
              title={asText((item.order as Record<string, unknown>)?.invoice_number ?? item.id)}
              subtitle={`${dateText(asText(item.created_at, ''))} • ${asText((item.driver as Record<string, unknown>)?.name, 'بدون سائق')}`}
              metric={item.delivery_fee ? money(item.delivery_fee) : undefined}
              badgeLabel={deliveryStatusLabel(st)}
              badgeTone={deliveryStatusTone(st)}
              leadingIcon={moduleIcons.delivery}
              onPress={() => navigation.navigate('DeliveryDetail', { id: String(item.id) })}
            />
          );
        }}
      />
    </ListScreenLayout>
  );
}
