import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { flexRow } from '@/constants/layout';
import { inventoryAPI, warehousesAPI } from '@/api/inventory';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppCard, AppListItem, AppSectionHeader, AppStatCard } from '@/components/ui';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractArray } from '@/utils/data';
import { numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';

export function InventoryScreen({ navigation }: { navigation: any }) {
  const [balances, setBalances] = useState<Record<string, unknown>[]>([]);
  const [expiry, setExpiry] = useState<Record<string, unknown>[]>([]);
  const [warehouses, setWarehouses] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [balancesRes, expiryRes, warehousesRes] = await Promise.all([
        inventoryAPI.balances({ per_page: 20 }),
        inventoryAPI.expiryStock({ per_page: 10, near_expiry_only: true }),
        warehousesAPI.list({ per_page: 50 }),
      ]);
      setBalances(extractArray(balancesRes));
      setExpiry(extractArray(expiryRes));
      setWarehouses(extractArray(warehousesRes));
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
    <AppScreen title="المخزون" subtitle="أرصدة وتنبيهات ومخازن" refreshing={loading} onRefresh={load}>
      {loading ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <>
          <View style={styles.stats}>
            <AppStatCard label="الأرصدة المعروضة" value={numberText(balances.length)} tone="primary" />
            <AppStatCard label="تنبيهات صلاحية" value={numberText(expiry.length)} tone="warning" />
            <AppStatCard label="المخازن" value={numberText(warehouses.length)} tone="info" />
          </View>

          <View style={styles.actionButtons}>
            <AppButton title="تسوية مخزون" variant="primary" onPress={() => navigation.navigate('StockAdjustment')} style={styles.actionBtn} />
            <AppButton title="تحويل مخزون" variant="secondary" onPress={() => navigation.navigate('StockTransfer')} style={styles.actionBtn} />
          </View>

          <AppCard style={styles.card}>
            <AppSectionHeader title="أرصدة المخزون" />
            {balances.length === 0 ? <AppEmptyState title="لا توجد أرصدة" /> : balances.map((row, index) => (
              <AppListItem
                key={String(row.id ?? index)}
                title={String((row.product as any)?.name ?? row.product_name ?? row.name ?? 'منتج')}
                subtitle={`${row.warehouse_name ?? (row.warehouse as any)?.name ?? 'مخزن'} • ${row.category_name ?? ''}`}
                meta={`الكمية: ${numberText(row.quantity)}`}
                badge={<AppBadge label={String(row.balance_status_label_ar ?? 'رصيد')} tone={Number(row.quantity ?? 0) <= 0 ? 'danger' : 'success'} />}
              />
            ))}
          </AppCard>
          <AppCard style={styles.card}>
            <AppSectionHeader title="تنبيهات الصلاحية" />
            {expiry.length === 0 ? <AppEmptyState title="لا توجد تنبيهات صلاحية" /> : expiry.map((row, index) => (
              <AppListItem key={String(row.batch_id ?? index)} title={String(row.product_name ?? 'منتج')} subtitle={`${row.warehouse_name ?? 'مخزن'} • دفعة ${row.batch_number ?? '—'}`} meta={`متبقي: ${numberText(row.days_to_expiry)} يوم`} badge={<AppBadge label={String(row.status ?? 'تنبيه')} tone={row.status === 'expired' ? 'danger' : 'warning'} />} />
            ))}
          </AppCard>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  stats: { ...flexRow, flexWrap: 'wrap', gap: spacing.md },
  actionButtons: { ...flexRow, gap: spacing.md },
  actionBtn: { flex: 1 },
  card: { gap: spacing.md },
});
