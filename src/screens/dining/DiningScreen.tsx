import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { diningAPI } from '@/api/dining';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { useBranchStore } from '@/store/branchStore';
import type { DiningHall, DiningTable } from '@/types/api';
import { normalizeApiError } from '@/utils/errors';

export function DiningScreen({ navigation }: { navigation: any }) {
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const [halls, setHalls] = useState<DiningHall[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeBranch?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [hallsRes, tablesRes] = await Promise.all([
        diningAPI.listHallsForPos(activeBranch.id),
        diningAPI.listTablesForBranch(activeBranch.id),
      ]);
      setHalls(Array.isArray(hallsRes.data) ? hallsRes.data : []);
      const tableData = tablesRes.data as any;
      setTables(Array.isArray(tableData?.tables) ? tableData.tables : Array.isArray(tablesRes.data) ? tablesRes.data as any : []);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [activeBranch?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppScreen title="القاعات والطاولات" subtitle="حالة الصالات وطلبات الطاولات" refreshing={loading} onRefresh={load}>
      {!activeBranch ? <AppEmptyState title="اختر فرعاً أولاً" /> : null}
      {loading ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && activeBranch ? (
        <>
          <AppCard style={styles.card}>
            <AppSectionHeader title="القاعات" />
            {halls.length === 0 ? <AppEmptyState title="لا توجد قاعات" /> : halls.map((hall) => (
              <AppListItem key={hall.id} title={hall.name} subtitle={`${hall.tables?.length ?? 0} طاولة`} badge={<AppBadge label={hall.is_active === false ? 'غير نشطة' : 'نشطة'} tone={hall.is_active === false ? 'warning' : 'success'} />} />
            ))}
          </AppCard>
          <AppCard style={styles.card}>
            <AppSectionHeader title="الطاولات" />
            {tables.length === 0 ? <AppEmptyState title="لا توجد طاولات" /> : tables.map((table) => (
              <AppListItem
                key={table.id}
                title={table.name || `طاولة ${table.number ?? table.id}`}
                subtitle={`السعة: ${table.capacity ?? '—'}`}
                badge={<AppBadge label={String(table.status ?? 'available')} tone={table.status === 'available' ? 'success' : table.status === 'occupied' ? 'warning' : 'default'} />}
                onPress={() => navigation.navigate('DiningTableOrder', { tableId: table.id, tableName: table.name ?? table.number ?? undefined })}
              />
            ))}
          </AppCard>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
});
