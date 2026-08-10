import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { deliveryFinanceAPI } from '@/api/deliveryFinance';
import { AppScreen } from '@/components/layout';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { DenseRow, MadarSection, MadarSurface, MetricBlock, QuickActionBar } from '@/components/madar';
import { extractData } from '@/utils/data';
import { money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { flexRow } from '@/constants/layout';

export function DeliveryFinanceDashboardScreen({ navigation }: { navigation: any }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryFinanceAPI.dashboard();
      setData(extractData(res) as Record<string, unknown> | null);
      setError(null);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const kpis = (data?.kpis as Record<string, unknown>) ?? {};

  return (
    <AppScreen title="مالية التوصيل" onBack={navigation.goBack} onRefresh={() => void load()} refreshing={loading}>
      {loading && !data ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      {data ? (
        <View style={{ gap: spacing.md }}>
          <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
            <MetricBlock label="مستحقات" value={money(kpis.outstanding_total_due ?? 0)} level="B" tone="warning" style={{ flex: 1, minWidth: 140 }} />
            <MetricBlock label="محصّل اليوم" value={money(kpis.today_settled_amount ?? 0)} level="B" tone="positive" style={{ flex: 1, minWidth: 140 }} />
            <MetricBlock label="متأخر" value={money(kpis.overdue_total_due ?? 0)} level="B" tone="negative" style={{ flex: 1, minWidth: 140 }} />
          </View>
          <MadarSection title="أقسام">
            <MadarSurface padded={false}>
              <DenseRow primary="الالتزامات" onPress={() => navigation.navigate('DeliveryFinanceLiabilities')} showDivider />
              <DenseRow primary="التسويات" onPress={() => navigation.navigate('DeliveryFinanceSettlements')} showDivider />
              <DenseRow primary="التنبيهات" onPress={() => navigation.navigate('DeliveryFinanceAlerts')} showDivider={false} />
            </MadarSurface>
          </MadarSection>
          <MadarSection title="تسوية سائق">
            <MadarSurface>
              <AppEmptyState
                title="معطّلة على الجوال"
                message="تسوية السائقين تتطلب خزنة وطلبات متعددة — من شاشة تسويات السائقين (قراءة فقط)."
              />
              <QuickActionBar
                actions={[
                  {
                    id: 'settlements',
                    label: 'تسويات السائقين',
                    icon: 'truck',
                    onPress: () => navigation.navigate('DriverSettlements'),
                  },
                ]}
              />
            </MadarSurface>
          </MadarSection>
        </View>
      ) : null}
    </AppScreen>
  );
}
