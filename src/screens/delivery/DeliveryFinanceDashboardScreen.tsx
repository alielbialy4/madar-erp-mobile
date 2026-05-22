import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { deliveryFinanceAPI } from '@/api/deliveryFinance';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppStatCard, AppSectionHeader } from '@/components/ui';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractData } from '@/utils/data';
import { money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';

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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <View style={{ flex: 1, minWidth: 140 }}><AppStatCard label="مستحقات" value={money(kpis.outstanding_total_due ?? 0)} tone="warning" /></View>
            <View style={{ flex: 1, minWidth: 140 }}><AppStatCard label="محصّل اليوم" value={money(kpis.today_settled_amount ?? 0)} tone="success" /></View>
            <View style={{ flex: 1, minWidth: 140 }}><AppStatCard label="متأخر" value={money(kpis.overdue_total_due ?? 0)} tone="danger" /></View>
          </View>
          <AppCard>
            <AppSectionHeader title="أقسام" />
            <AppButton title="الالتزامات" variant="secondary" onPress={() => navigation.navigate('DeliveryFinanceLiabilities')} />
            <AppButton title="التسويات" variant="secondary" onPress={() => navigation.navigate('DeliveryFinanceSettlements')} />
            <AppButton title="التنبيهات" variant="secondary" onPress={() => navigation.navigate('DeliveryFinanceAlerts')} />
          </AppCard>
          <AppCard>
            <AppSectionHeader title="تسوية سائق" />
            <AppEmptyState title="معطّلة على الجوال" message="تسوية السائقين تتطلب خزنة وطلبات متعددة — من شاشة تسويات السائقين (قراءة فقط)." />
          </AppCard>
        </View>
      ) : null}
    </AppScreen>
  );
}
