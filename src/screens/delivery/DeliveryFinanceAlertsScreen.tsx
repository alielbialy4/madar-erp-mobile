import React, { useCallback, useEffect, useState } from 'react';
import { deliveryFinanceAPI } from '@/api/deliveryFinance';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractData } from '@/utils/data';
import { asText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';

export function DeliveryFinanceAlertsScreen({ navigation }: { navigation: any }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryFinanceAPI.alerts();
      const data = extractData(res) as { alerts?: Record<string, unknown>[] } | undefined;
      setRows(Array.isArray(data?.alerts) ? data.alerts : []);
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

  return (
    <AppScreen title="تنبيهات مالية التوصيل" onBack={navigation.goBack} onRefresh={() => void load()} refreshing={loading}>
      {loading ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      <AppCard>
        <AppSectionHeader title="تنبيهات" />
        {rows.map((row, i) => (
          <AppListItem
            key={String(row.id ?? i)}
            title={asText(row.title, 'تنبيه')}
            subtitle={asText(row.message, '')}
            badge={<AppBadge label={String(row.severity ?? 'medium')} tone={row.severity === 'high' ? 'danger' : 'warning'} />}
          />
        ))}
      </AppCard>
    </AppScreen>
  );
}
