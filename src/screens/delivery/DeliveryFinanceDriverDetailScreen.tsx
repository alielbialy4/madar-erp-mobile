import React from 'react';
import { View } from 'react-native';
import { deliveryFinanceAPI, type DeliveryFinanceDriverDetail } from '@/api/deliveryFinance';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import { AppListItem } from '@/components/ui';
import { MadarSection, MadarSurface, MetricBlock } from '@/components/madar';
import { AppEmptyState } from '@/components/feedback';
import { asText, dateText, money } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { flexRow } from '@/constants/layout';

function rowValue(row: Record<string, unknown> | null | undefined, key: string) {
  return row && key in row ? row[key] : undefined;
}

export function DeliveryFinanceDriverDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const driverId = String(route.params?.driverId ?? '');
  return (
    <DetailScreen<DeliveryFinanceDriverDetail>
      title={route.params?.name ?? 'الملف المالي للسائق'}
      onBack={navigation.goBack}
      loader={() => deliveryFinanceAPI.driverDetail(driverId)}
      badge={(item) => ({ label: asText(item.risk_level, 'risk'), tone: item.risk_level === 'high' ? 'danger' : 'info' })}
      fields={[
        { label: 'السائق', value: (item) => item.driver?.name },
        { label: 'الهاتف', value: (item) => item.driver?.phone, ltr: true },
        { label: 'الفرع', value: (item) => item.driver?.branch_name },
        { label: 'الحالة', value: (item) => (item.driver?.is_active === false ? 'متوقف' : 'نشط') },
      ]}
    >
      {(item) => {
        const outstanding = item.outstanding ?? {};
        const performance = item.performance ?? {};
        const settlements = item.recent_settlements ?? [];
        const deliveries = item.outstanding_deliveries ?? [];
        const alerts = item.alerts ?? [];
        return (
          <View style={{ gap: spacing.md }}>
            <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
              <MetricBlock
                label="صافي المطلوب"
                value={money(rowValue(outstanding, 'total_due_from_driver') ?? rowValue(outstanding, 'net_due_from_driver') ?? 0)}
                level="B"
                tone="warning"
                style={{ flex: 1, minWidth: 140 }}
              />
              <MetricBlock
                label="طلبات قائمة"
                value={String(rowValue(outstanding, 'count') ?? deliveries.length)}
                level="B"
                tone="info"
                style={{ flex: 1, minWidth: 140 }}
              />
              <MetricBlock
                label="طلبات مسلمة"
                value={String(rowValue(performance, 'delivered_count') ?? 0)}
                level="B"
                tone="positive"
                style={{ flex: 1, minWidth: 140 }}
              />
            </View>

            <MadarSection title="الطلبات غير المسواة">
              <MadarSurface padded={false}>
                {deliveries.length === 0 ? (
                  <AppEmptyState title="لا توجد عهدة قائمة" />
                ) : (
                  deliveries.slice(0, 20).map((row, index) => (
                    <AppListItem
                      key={String(row.id ?? index)}
                      title={asText(row.order_number ?? row.invoice_number ?? row.id, 'طلب')}
                      subtitle={`${dateText(asText(row.delivered_at ?? row.created_at, ''))} • ${asText(row.customer_name, 'عميل')}`}
                      meta={money(row.cod_amount ?? row.cash_collected ?? row.total ?? 0)}
                    />
                  ))
                )}
              </MadarSurface>
            </MadarSection>

            <MadarSection title="آخر التسويات">
              <MadarSurface padded={false}>
                {settlements.length === 0 ? (
                  <AppEmptyState title="لا توجد تسويات في النطاق" />
                ) : (
                  settlements.slice(0, 10).map((row, index) => (
                    <AppListItem
                      key={String(row.id ?? index)}
                      title={asText(row.reference_no ?? row.id, 'تسوية')}
                      subtitle={dateText(asText(row.settled_at ?? row.created_at, ''))}
                      meta={money(row.amount ?? row.total_amount ?? 0)}
                    />
                  ))
                )}
              </MadarSurface>
            </MadarSection>

            <MadarSection title="التنبيهات">
              <MadarSurface padded={false}>
                {alerts.length === 0 ? (
                  <AppEmptyState title="لا توجد تنبيهات حالية" />
                ) : (
                  alerts.slice(0, 10).map((row, index) => (
                    <AppListItem
                      key={String(row.id ?? index)}
                      title={asText(row.title ?? row.type, 'تنبيه')}
                      subtitle={asText(row.message ?? row.description, '')}
                      meta={dateText(asText(row.created_at, ''))}
                    />
                  ))
                )}
              </MadarSurface>
            </MadarSection>
          </View>
        );
      }}
    </DetailScreen>
  );
}
