import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { flexRow } from '@/constants/layout';
import { reportsAPI } from '@/api/reports';
import { AppScreen } from '@/components/layout';
import { AppCard, AppListItem, AppSectionHeader, AppStatCard } from '@/components/ui';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { useBranchStore } from '@/store/branchStore';
import { extractArray, extractData } from '@/utils/data';
import { money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';

export function ReportsScreen() {
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const today = new Date().toISOString().slice(0, 10);
    try {
      const params = { from_date: today, to_date: today, ...(activeBranch?.id ? { branch_id: activeBranch.id } : {}) };
      const [sales, inventory, purchases, suppliers, shifts, coupons] = await Promise.allSettled([
        reportsAPI.salesDashboard(params),
        reportsAPI.inventory({ per_page: 5 }),
        reportsAPI.comprehensivePurchases(params),
        reportsAPI.suppliers({ per_page: 5 }),
        reportsAPI.shiftPerformance(params),
        reportsAPI.coupons(params),
      ]);
      setData({
        sales: sales.status === 'fulfilled' ? extractData(sales.value) : null,
        inventory: inventory.status === 'fulfilled' ? extractArray(inventory.value) : [],
        purchases: purchases.status === 'fulfilled' ? extractData(purchases.value) : null,
        suppliers: suppliers.status === 'fulfilled' ? extractArray(suppliers.value) : [],
        shifts: shifts.status === 'fulfilled' ? extractData(shifts.value) : null,
        coupons: coupons.status === 'fulfilled' ? extractData(coupons.value) : null,
      });
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [activeBranch?.id]);

  useEffect(() => { void load(); }, [load]);

  return (
    <AppScreen title="التقارير" subtitle="ملخصات موبايل مختصرة" refreshing={loading} onRefresh={load}>
      {loading ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <>
          <View style={styles.stats}>
            <AppStatCard label="مبيعات اليوم" value={money(data.sales?.today_sales ?? data.sales?.total_sales ?? 0)} tone="primary" />
            <AppStatCard label="فواتير" value={numberText(data.sales?.orders_count ?? data.sales?.invoice_count ?? 0)} tone="info" />
            <AppStatCard label="مشتريات" value={money(data.purchases?.total ?? data.purchases?.total_purchases ?? 0)} tone="warning" />
            <AppStatCard label="كوبونات" value={numberText(data.coupons?.usage_count ?? data.coupons?.count ?? 0)} tone="success" />
          </View>
          <AppCard style={styles.card}>
            <AppSectionHeader title="ملخص المخزون" />
            {data.inventory?.length ? data.inventory.slice(0, 5).map((row: any, index: number) => (
              <AppListItem key={String(row.id ?? index)} title={String(row.product_name ?? row.name ?? 'منتج')} subtitle={`الكمية: ${numberText(row.quantity ?? row.stock_quantity ?? 0)}`} meta={money(row.value ?? row.total_value ?? 0)} />
            )) : <AppEmptyState title="لا توجد بيانات مخزون" />}
          </AppCard>
          <AppCard style={styles.card}>
            <AppSectionHeader title="ملخص الموردين" />
            {data.suppliers?.length ? data.suppliers.slice(0, 5).map((row: any, index: number) => (
              <AppListItem key={String(row.id ?? index)} title={String(row.name ?? row.supplier_name ?? 'مورد')} meta={money(row.balance ?? row.total ?? 0)} />
            )) : <AppEmptyState title="لا توجد بيانات موردين" />}
          </AppCard>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  stats: { ...flexRow, flexWrap: 'wrap', gap: spacing.md },
  card: { gap: spacing.md },
});
