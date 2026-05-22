import React, { useCallback, useEffect, useState } from 'react';
import { deliveryFinanceAPI } from '@/api/deliveryFinance';
import { AppScreen } from '@/components/layout';
import { AppListItem, AppSectionHeader } from '@/components/ui';
import { AppCard } from '@/components/ui';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractData } from '@/utils/data';
import { asText, money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';

export function DeliveryFinanceLiabilitiesScreen({ navigation }: { navigation: any }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryFinanceAPI.liabilities();
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
    <AppScreen title="التزامات التوصيل" onBack={navigation.goBack} onRefresh={() => void load()} refreshing={loading}>
      {loading ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      <AppCard>
        <AppSectionHeader title="سائقون" />
        {rows.map((row, i) => (
          <AppListItem
            key={String(row.driver_id ?? i)}
            title={asText(row.driver_name, 'سائق')}
            subtitle={`${row.deliveries_count ?? 0} طلب`}
            meta={money(row.net_due_from_driver ?? row.remaining_to_collect ?? 0)}
          />
        ))}
      </AppCard>
    </AppScreen>
  );
}
