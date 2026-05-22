import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ListParams } from '@/types/api';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppInput, AppListItem, AppSelect } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { deliveriesAPI } from '@/api/deliveries';
import { deliveryStatusLabel, deliveryStatusTone } from '@/utils/deliveryStatus';
import { asText, dateText, money } from '@/utils/format';
import { spacing } from '@/constants/spacing';

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
    <AppScreen title="التوصيل" subtitle="طلبات وسائقون ومناطق ومالية" scroll={false}>
      <View style={styles.hub}>
        <AppButton title="السائقون" variant="secondary" onPress={() => navigation.navigate('DriversList')} />
        <AppButton title="المناطق" variant="secondary" onPress={() => navigation.navigate('DeliveryZonesList')} />
        <AppButton title="تسويات السائقين" variant="secondary" onPress={() => navigation.navigate('DriverSettlements')} />
        <AppButton title="مالية التوصيل" variant="secondary" onPress={() => navigation.navigate('DeliveryFinanceDashboard')} />
      </View>
      <View style={styles.filters}>
        <AppInput value={query} onChangeText={setQuery} placeholder="بحث..." returnKeyType="search" />
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
      </View>
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
            <AppListItem
              title={asText((item.order as Record<string, unknown>)?.invoice_number ?? item.id)}
              subtitle={`${dateText(asText(item.created_at, ''))} • ${asText((item.driver as Record<string, unknown>)?.name, 'بدون سائق')}`}
              meta={item.delivery_fee ? money(item.delivery_fee) : undefined}
              badge={<AppBadge label={deliveryStatusLabel(st)} tone={deliveryStatusTone(st)} />}
              onPress={() => navigation.navigate('DeliveryDetail', { id: String(item.id) })}
            />
          );
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hub: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  filters: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
});
