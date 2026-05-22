import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { kitchenAPI } from '@/api/kitchen';
import { kitchenStationsAPI } from '@/api/kitchenStations';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppInput, AppListItem, AppSelect } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import type { KitchenOrder } from '@/types/api';
import { extractArray, extractData } from '@/utils/data';
import { dateText, numberText } from '@/utils/format';
import { spacing } from '@/constants/spacing';

const STATUS_COLUMNS = [
  { key: '', label: 'الكل' },
  { key: 'pending', label: 'انتظار' },
  { key: 'preparing', label: 'تحضير' },
  { key: 'ready', label: 'جاهز' },
];

export function KitchenScreen({ navigation }: { navigation: any }) {
  const [status, setStatus] = useState('');
  const [stationId, setStationId] = useState('');
  const [query, setQuery] = useState('');
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [stations, setStations] = useState<{ label: string; value: string }[]>([]);
  const debounced = useDebouncedValue(query);
  const params = useMemo(
    () => ({
      ...(status ? { status } : {}),
      ...(stationId ? { station_id: stationId } : {}),
      ...(debounced ? { search: debounced } : {}),
      per_page: 40,
    }),
    [debounced, stationId, status],
  );
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<KitchenOrder & Record<string, unknown>>(
    kitchenAPI.getOrders,
    params,
  );

  useEffect(() => {
    void kitchenAPI.getStats().then((res) => setStats(extractData(res) as Record<string, unknown> | null));
    void kitchenStationsAPI.active().then((res) => {
      const list = extractArray<Record<string, unknown>>(res);
      setStations([{ label: 'كل المحطات', value: '' }, ...list.map((s) => ({ label: String(s.name), value: String(s.id) }))]);
    });
  }, []);

  return (
    <AppScreen title="شاشة المطبخ" subtitle="KDS — تحديث الحالة والمحطات" scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <AppButton title="محطات" variant="secondary" onPress={() => navigation.navigate('KitchenStationsList')} />
          <AppButton title="طباعة" variant="secondary" onPress={() => navigation.navigate('KitchenPrintJobs')} />
        </View>
        {stats ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            <AppBadge label={`انتظار: ${numberText(stats.pending ?? 0)}`} tone="warning" />
            <AppBadge label={`تحضير: ${numberText(stats.preparing ?? 0)}`} tone="info" />
            <AppBadge label={`جاهز: ${numberText(stats.ready ?? 0)}`} tone="success" />
          </View>
        ) : null}
        <AppInput value={query} onChangeText={setQuery} placeholder="بحث برقم الفاتورة..." />
        <AppSelect label="الحالة" value={status || null} onChange={(v) => setStatus(v ?? '')} options={STATUS_COLUMNS.map((c) => ({ label: c.label, value: c.key }))} />
        {stations.length > 1 ? (
          <AppSelect label="المحطة" value={stationId || null} onChange={(v) => setStationId(v ?? '')} options={stations} />
        ) : null}
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
            subtitle={`${dateText(item.created_at)} • ${item.order_type ?? '—'} • ${(item.dining_table as Record<string, unknown>)?.name ?? ''}`}
            meta={`${numberText(item.items?.length ?? 0)} صنف • ${numberText(item.wait_time ?? 0)} د`}
            badge={
              <AppBadge
                label={String(item.kitchen_status ?? item.status ?? 'pending')}
                tone={item.is_overdue ? 'danger' : item.kitchen_status === 'ready' ? 'success' : 'warning'}
              />
            }
            onPress={() => navigation.navigate('KitchenOrder', { id: item.id })}
          />
        )}
      />
    </AppScreen>
  );
}
