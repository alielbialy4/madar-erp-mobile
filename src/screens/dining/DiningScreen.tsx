import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { diningAPI } from '@/api/dining';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppCard, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { useBranchStore } from '@/store/branchStore';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { normalizeApiError } from '@/utils/errors';
import { tableStatusColor, tableStatusLabel, tableStatusTone } from '@/utils/diningTableStatus';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import type { DiningTable } from '@/types/api';

type TableRow = DiningTable & { dining_hall?: { id: string; name: string } };

export function DiningScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_dining');

  const [tables, setTables] = useState<TableRow[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
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
      const tablesRes = await diningAPI.listTablesForBranch(activeBranch.id);
      const data = tablesRes.data as { tables?: TableRow[]; status_counts?: Record<string, number> };
      setTables(Array.isArray(data?.tables) ? data.tables : []);
      setStatusCounts(data?.status_counts ?? {});
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [activeBranch?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, TableRow[]>();
    for (const t of tables) {
      const hall = t.dining_hall?.name ?? 'غير مصنف';
      if (!map.has(hall)) map.set(hall, []);
      map.get(hall)!.push(t);
    }
    return [...map.entries()];
  }, [tables]);

  const counts = useMemo(
    () => ({
      available: statusCounts.available ?? tables.filter((t) => t.status === 'available').length,
      occupied: statusCounts.occupied ?? tables.filter((t) => t.status === 'occupied').length,
      reserved: statusCounts.reserved ?? tables.filter((t) => t.status === 'reserved').length,
    }),
    [statusCounts, tables],
  );

  return (
    <AppScreen title="القاعات والطاولات" subtitle="حالة الطاولات والطلبات النشطة" refreshing={loading} onRefresh={load}>
      {!activeBranch ? <AppEmptyState title="اختر فرعاً أولاً" /> : null}
      <AppCard style={styles.banner}>
        <Text style={{ color: c.textMuted, fontSize: 13 }}>
          التخزين دون اتصال للقاعات غير مفعّل: لا يوجد عقد آمن لمزامنة طلبات الطاولات دون شبكة. يتطلب اتصالاً بالخادم.
        </Text>
      </AppCard>
      <View style={styles.actionsRow}>
        <AppButton title="وضع النادل" onPress={() => navigation.navigate('WaiterPos')} />
        {canManage ? (
          <AppButton title="قاعة جديدة" variant="secondary" onPress={() => navigation.navigate('DiningHallForm', {})} />
        ) : null}
      </View>
      <View style={styles.legendRow}>
        {(['available', 'occupied', 'reserved'] as const).map((s) => (
          <View key={s} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: tableStatusColor(s) }]} />
            <Text style={{ fontSize: 12, color: c.text }}>
              {tableStatusLabel(s)} ({counts[s]})
            </Text>
          </View>
        ))}
      </View>
      {loading ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && activeBranch ? (
        grouped.length === 0 ? (
          <AppEmptyState title="لا توجد طاولات" />
        ) : (
          grouped.map(([hallName, hallTables]) => (
            <AppCard key={hallName} style={styles.card}>
              <AppSectionHeader title={hallName} />
              <View style={styles.grid}>
                {hallTables.map((table) => (
                  <Pressable
                    key={table.id}
                    onPress={() =>
                      navigation.navigate('DiningTableOrder', {
                        tableId: table.id,
                        tableName: table.name ?? String(table.number ?? table.id),
                      })
                    }
                    style={({ pressed }) => [
                      styles.tableTile,
                      { borderColor: tableStatusColor(table.status), backgroundColor: c.surface, opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <Text style={[styles.tableName, { color: c.text }]} numberOfLines={1}>
                      {table.name || `طاولة ${table.number ?? table.id}`}
                    </Text>
                    <AppBadge label={tableStatusLabel(table.status)} tone={tableStatusTone(table.status)} />
                    <Text style={{ fontSize: 11, color: c.textMuted }}>{table.capacity ?? '—'} أشخاص</Text>
                    {(table as TableRow & { current_order?: { id: number; total?: number } }).current_order ? (
                      <Text style={{ fontSize: 11, color: c.accent, fontWeight: '700' }}>
                        طلب #{(table as TableRow & { current_order?: { id: number } }).current_order!.id}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </AppCard>
          ))
        )
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  banner: { marginBottom: spacing.sm },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  card: { gap: spacing.sm, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tableTile: {
    width: '30%',
    minWidth: 100,
    flexGrow: 1,
    borderWidth: 2,
    borderRadius: 12,
    padding: spacing.sm,
    gap: 4,
    alignItems: 'center',
  },
  tableName: { fontWeight: '800', fontSize: 14 },
});
