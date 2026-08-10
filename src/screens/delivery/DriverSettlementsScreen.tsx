import React, { useCallback } from 'react';
import { View } from 'react-native';
import { driverSettlementsAPI } from '@/api/driverSettlements';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppListItem } from '@/components/ui';
import { AttentionBand, MadarSurface } from '@/components/madar';
import { ResourceList } from '@/components/lists';
import { useListResource } from '@/hooks/useListResource';
import type { ApiEnvelope, ListParams } from '@/types/api';
import { asText, dateText, money } from '@/utils/format';
import { spacing } from '@/constants/spacing';

const BLOCKED_REASON =
  'تسوية السائقين تتطلب ربط مالي متعدد الطلبات والخزنة، وتبقى حالياً من الويب فقط.';

export function DriverSettlementsScreen({ navigation }: { navigation: any }) {
  const loader = useCallback(
    (p: ListParams) => driverSettlementsAPI.list(p) as Promise<ApiEnvelope<Record<string, unknown>[]>>,
    [],
  );
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource(loader, {});

  return (
    <AppScreen title="تسويات السائقين" subtitle="قراءة وتنقّل آمن للتسويات" onBack={navigation.goBack} scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <AttentionBand
          title="قيود الجوال"
          items={[
            { id: 'blocked', title: 'إنشاء التسوية من الجوال معطّل', detail: BLOCKED_REASON, tone: 'warning' },
          ]}
        />
        <MadarSurface>
          <AppButton title="لوحة مالية التوصيل" variant="secondary" onPress={() => navigation.navigate('DeliveryFinanceDashboard')} />
        </MadarSurface>
      </View>
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا تسويات"
        keyExtractor={(row, index) => String(row.id ?? index)}
        renderItem={({ item }) => (
          <AppListItem
            title={`سائق ${asText((item.driver as Record<string, unknown>)?.name, String(item.driver_id ?? ''))}`}
            subtitle={dateText(asText(item.created_at, ''))}
            meta={money(item.amount_received ?? 0)}
            badge={<AppBadge label="قراءة فقط" tone="neutral" />}
          />
        )}
      />
    </AppScreen>
  );
}
