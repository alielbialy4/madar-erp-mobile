import React, { useCallback } from 'react';
import { View } from 'react-native';
import { driverSettlementsAPI } from '@/api/driverSettlements';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { ResourceList } from '@/components/lists';
import { useListResource } from '@/hooks/useListResource';
import type { ApiEnvelope, ListParams } from '@/types/api';
import { asText, dateText, money } from '@/utils/format';
import { textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

const BLOCKED_REASON =
  'تسوية السائقين تتطلب ربط مالي متعدد الطلبات والخزنة، وتبقى حالياً من الويب فقط.';

export function DriverSettlementsScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const loader = useCallback(
    (p: ListParams) => driverSettlementsAPI.list(p) as Promise<ApiEnvelope<Record<string, unknown>[]>>,
    [],
  );
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource(loader, {});

  return (
    <AppScreen title="تسويات السائقين" subtitle="قراءة وتنقّل آمن للتسويات" onBack={navigation.goBack} scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <AppCard>
          <AppSectionHeader title="إنشاء التسوية من الجوال معطّل" />
          <Text style={{ ...textStart, color: c.textMuted, lineHeight: 22 }}>
            {BLOCKED_REASON}
          </Text>
          <Text style={{ ...textStart, color: c.textMuted, lineHeight: 22 }}>
            السبب التقني: العقد موجودة على الخادم، لكن تنفيذها بأمان يتطلب شاشة اختيار مندوب وفرع وتوصيلات غير مسوّاة متعددة وخزينة نشطة وصلاحية delivery_settle ومراجعة نقدية قبل الإيداع. تركنا الجوال للقراءة حتى لا ينتج إيداع خزنة غير مقصود.
          </Text>
          <AppButton title="لوحة مالية التوصيل" variant="secondary" onPress={() => navigation.navigate('DeliveryFinanceDashboard')} />
        </AppCard>
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
