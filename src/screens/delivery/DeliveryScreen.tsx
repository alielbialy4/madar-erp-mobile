import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ListParams } from '@/types/api';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppInput, AppListItem } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { deliveriesAPI } from '@/api/deliveries';
import { asText, dateText, money } from '@/utils/format';
import { spacing } from '@/constants/spacing';

export function DeliveryScreen() {
  const [query, setQuery] = React.useState('');
  const debounced = useDebouncedValue(query);
  const params: ListParams = { ...(debounced ? { search: debounced } : {}) };
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Record<string, unknown>>((p) => deliveriesAPI.getAll(p) as any, params);

  return (
    <AppScreen title="التوصيل" subtitle="طلبات التوصيل" scroll={false}>
      <View style={styles.searchWrap}>
        <AppInput value={query} onChangeText={setQuery} placeholder="بحث..." returnKeyType="search" />
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
          const status = String(item.status ?? '');
          const tone = ['delivered', 'completed'].includes(status) ? 'success' : ['pending', 'assigned', 'picked_up'].includes(status) ? 'warning' : ['cancelled', 'failed'].includes(status) ? 'danger' : 'default';
          return (
            <AppListItem
              title={asText((item as any).order?.invoice_number ?? item.id)}
              subtitle={`${dateText(asText(item.created_at, ''))} • ${asText((item as any).driver?.name ?? 'بدون سائق')}`}
              meta={item.delivery_fee ? money(item.delivery_fee) : undefined}
              badge={<AppBadge label={status} tone={tone} />}
            />
          );
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
});
