import React, { useCallback, useEffect, useState } from 'react';
import { deliveryFinanceAPI } from '@/api/deliveryFinance';
import { AppScreen } from '@/components/layout';
import { AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractData } from '@/utils/data';
import { asText, dateText, money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';

export function DeliveryFinanceSettlementsScreen({ navigation }: { navigation: any }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryFinanceAPI.settlements();
      const data = extractData(res) as { rows?: Record<string, unknown>[] } | undefined;
      setRows(Array.isArray(data?.rows) ? data.rows : []);
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
    <AppScreen title="تسويات مالية التوصيل" onBack={navigation.goBack} onRefresh={() => void load()} refreshing={loading}>
      {loading ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      <AppCard>
        <AppSectionHeader title="سجل التسويات (قراءة)" />
        {rows.map((row, i) => (
          <AppListItem key={String(row.id ?? i)} title={asText(row.driver_name, '—')} subtitle={dateText(asText(row.settled_at ?? row.created_at, ''))} meta={money(row.amount_received ?? row.total_collected ?? 0)} />
        ))}
      </AppCard>
    </AppScreen>
  );
}
