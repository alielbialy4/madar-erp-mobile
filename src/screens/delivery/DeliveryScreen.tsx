import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ListParams } from '@/types/api';
import { HeroActionChip, ListScreenLayout } from '@/components/layout';
import { AppSegmentedControl, AppSelect } from '@/components/ui';
import { OperationalRow } from '@/components/madar';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  deliveriesAPI,
  type DeliveryTrackingItem,
  type DeliveryTrackingResponse,
} from '@/api/deliveries';
import { deliveryStatusLabel, deliveryStatusTone } from '@/utils/deliveryStatus';
import { asText, dateText, money, numberText } from '@/utils/format';
import { spacing } from '@/constants/spacing';

type DeliveryView = 'active' | 'history';

const activeStatuses = [
  { label: 'كل الحالات النشطة', value: '' },
  { label: 'بانتظار التعيين', value: 'pending' },
  { label: 'تم التعيين', value: 'assigned' },
  { label: 'تم الاستلام', value: 'picked_up' },
  { label: 'في الطريق', value: 'in_transit' },
];

const historyStatuses = [
  { label: 'كل السجل', value: '' },
  { label: 'تم التوصيل', value: 'delivered' },
  { label: 'فشل', value: 'failed' },
  { label: 'مرتجع', value: 'returned' },
];

export function DeliveryScreen({ navigation }: { navigation: any }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState<DeliveryView>('active');
  const debounced = useDebouncedValue(query);

  const params: ListParams = useMemo(
    () => ({
      ...(debounced ? { search: debounced } : {}),
      ...(status ? { status } : {}),
      include_completed: view === 'history' ? 100 : 30,
    }),
    [debounced, status, view],
  );
  const loader = useCallback(() => deliveriesAPI.tracking(params), [params]);
  const { data, loading, refreshing, error, refresh } = useAsyncResource<DeliveryTrackingResponse>(loader);

  const activeRows = useMemo(() => {
    const lanes = data?.lanes;
    if (!lanes) return [];
    return [...lanes.pending, ...lanes.assigned, ...lanes.picked_up, ...lanes.in_transit];
  }, [data?.lanes]);
  const rows = view === 'active' ? activeRows : (data?.completed_recent ?? []);
  const summary = data?.summary;

  const setDeliveryView = (next: DeliveryView) => {
    setView(next);
    setStatus('');
  };

  return (
    <ListScreenLayout
      title="متابعة التوصيل"
      subtitle="تشغيل حي، تحصيل، وسجل التسليم"
      noHeader
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="فاتورة، عميل، هاتف أو عنوان..."
      onRefresh={refresh}
      refreshing={refreshing}
      filters={
        <View style={styles.filters}>
          <AppSegmentedControl
            value={view}
            onChange={setDeliveryView}
            options={[
              { label: `النشط ${numberText(summary?.active_total ?? 0)}`, value: 'active' },
              { label: 'السجل', value: 'history' },
            ]}
          />
          <AppSelect
            label="الحالة"
            value={status || null}
            onChange={(value) => setStatus(value ?? '')}
            options={view === 'active' ? activeStatuses : historyStatuses}
          />
        </View>
      }
      hero={{
        eyebrow: 'مركز التشغيل',
        title: 'التوصيل المباشر',
        subtitle: 'الأولوية للطلبات المتأخرة وما هو في الطريق الآن',
        stats: [
          { label: 'نشط الآن', value: summary?.active_total ?? 0 },
          { label: 'متأخر +15د', value: summary?.overdue_pending ?? 0, tone: (summary?.overdue_pending ?? 0) > 0 ? 'danger' : 'default' },
          { label: 'في الطريق', value: (summary?.picked_up ?? 0) + (summary?.in_transit ?? 0), tone: 'warning' },
          { label: 'تحصيل اليوم', value: money(summary?.total_collected_today ?? 0), tone: 'success' },
        ],
        actions: (
          <>
            <HeroActionChip label="السائقون" icon="people" onPress={() => navigation.navigate('DriversList')} />
            <HeroActionChip label="المناطق" icon="map" onPress={() => navigation.navigate('DeliveryZonesList')} />
            <HeroActionChip label="التسويات" icon="account-balance-wallet" onPress={() => navigation.navigate('DriverSettlements')} />
            <HeroActionChip label="المالية" icon="account-balance" onPress={() => navigation.navigate('DeliveryFinanceDashboard')} />
          </>
        ),
        compact: true,
      }}
    >
      <ResourceList<DeliveryTrackingItem>
        data={rows}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        emptyTitle={view === 'active' ? 'لا توجد طلبات توصيل نشطة' : 'لا توجد نتائج في سجل التوصيل'}
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={({ item }) => {
          const customer = asText(item.sale?.customer?.name, 'بيع مباشر');
          const driver = asText(item.driver?.name, 'بدون سائق');
          const zone = asText(item.delivery_zone?.name, 'بدون منطقة');
          const wait = Number(item.wait_minutes ?? 0);
          const collection = item.collection_method === 'driver' && Number(item.amount_to_collect ?? 0) > 0
            ? `تحصيل ${money(item.amount_to_collect ?? 0)}`
            : null;
          return (
            <OperationalRow
              primary={`فاتورة ${asText(item.sale?.invoice_number ?? item.sale_id ?? item.id)}`}
              secondary={`${customer} · ${driver}`}
              meta={[
                zone,
                wait > 0 ? `انتظار ${numberText(wait)} د` : dateText(asText(item.created_at, '')),
                collection,
              ].filter(Boolean).join(' · ')}
              amount={item.sale?.total ?? item.delivery_fee ?? 0}
              currency="ج.م"
              statusLabel={deliveryStatusLabel(item.status)}
              statusTone={deliveryStatusTone(item.status)}
              onPress={() => navigation.navigate('DeliveryDetail', { id: String(item.id) })}
            />
          );
        }}
      />
    </ListScreenLayout>
  );
}

const styles = StyleSheet.create({
  filters: { gap: spacing.sm },
});
