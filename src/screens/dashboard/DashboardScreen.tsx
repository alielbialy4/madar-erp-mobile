import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { pressScale } from '@/utils/animations';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppCard, AppListItem, AppSectionHeader, AppStatCard } from '@/components/ui';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { dashboardAPI } from '@/api/dashboard';
import { inventoryAPI } from '@/api/inventory';
import { kitchenAPI } from '@/api/kitchen';
import { reportsAPI } from '@/api/reports';
import { shiftsAPI } from '@/api/shifts';
import { useBranchStore } from '@/store/branchStore';
import { useAuthStore } from '@/store/authStore';
import { spacing, radius } from '@/constants/spacing';
import { colors } from '@/constants/colors';
import { extractArray, extractData } from '@/utils/data';
import { dateText, money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type DashboardData = {
  statistics?: Record<string, unknown>;
  operational?: Record<string, unknown>;
  lowStock: Record<string, unknown>[];
  expiryAlerts: Record<string, unknown>[];
  recentSales: Record<string, unknown>[];
  kitchenStats?: Record<string, unknown>;
  activeShift?: Record<string, unknown> | null;
};

export function DashboardScreen({ navigation }: { navigation: any }) {
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [statistics, operational, lowStock, expiryAlerts, recentSales, kitchenStats, activeShift] = await Promise.allSettled([
        dashboardAPI.getStatistics(),
        dashboardAPI.getBranchOperational(),
        reportsAPI.lowStock(),
        inventoryAPI.expiryStock({ per_page: 5, near_expiry_only: true }),
        reportsAPI.dailySales(),
        kitchenAPI.getStats(),
        activeBranch?.id ? shiftsAPI.current(activeBranch.id) : Promise.resolve({ data: null }),
      ]);

      setData({
        statistics: statistics.status === 'fulfilled' ? (extractData<Record<string, unknown>>(statistics.value) ?? {}) : {},
        operational: operational.status === 'fulfilled' ? (extractData<Record<string, unknown>>(operational.value) ?? {}) : {},
        lowStock: lowStock.status === 'fulfilled' ? extractArray<Record<string, unknown>>(lowStock.value) : [],
        expiryAlerts: expiryAlerts.status === 'fulfilled' ? extractArray<Record<string, unknown>>(expiryAlerts.value) : [],
        recentSales: recentSales.status === 'fulfilled' ? extractArray<Record<string, unknown>>(recentSales.value) : [],
        kitchenStats: kitchenStats.status === 'fulfilled' ? (extractData<Record<string, unknown>>(kitchenStats.value) ?? {}) : {},
        activeShift: activeShift.status === 'fulfilled' ? (extractData<Record<string, unknown> | null>(activeShift.value as any) ?? null) : null,
      });
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBranch?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppScreen title="الرئيسية" subtitle={user?.name ? `أهلاً ${user.name}` : undefined} refreshing={refreshing} onRefresh={() => load(true)} noHeader>
      {loading && !data ? <AppLoadingState /> : null}
      {error && !data ? <AppErrorState message={error} onRetry={() => load()} /> : null}
      {data ? (
        <>
          <View style={styles.heroSection}>
            <View style={styles.statsGrid}>
              <AppStatCard
                label="مبيعات اليوم"
                value={money(data.statistics?.today_sales ?? data.operational?.today_sales ?? 0)}
                tone="primary"
                tier="primary"
                icon={<MaterialIcons name="payments" size={24} color={colors.accent} />}
              />
              <AppStatCard
                label="عدد الطلبات"
                value={numberText(data.statistics?.orders_count ?? data.operational?.orders_count ?? 0)}
                tone="info"
                tier="primary"
                icon={<MaterialIcons name="receipt" size={24} color={colors.info} />}
              />
              <AppStatCard
                label="طلبات المطبخ"
                value={numberText(data.kitchenStats?.pending ?? 0)}
                tone="warning"
                tier="secondary"
                icon={<MaterialIcons name="restaurant-menu" size={20} color={colors.warning} />}
              />
              <AppStatCard
                label="أصناف منخفضة"
                value={numberText(data.lowStock.length)}
                tone="danger"
                tier="secondary"
                icon={<MaterialIcons name="warning" size={20} color={colors.danger} />}
              />
              <AppStatCard
                label="تنبيهات الصلاحية"
                value={numberText(data.expiryAlerts.length)}
                tone="warning"
                tier="secondary"
                icon={<MaterialIcons name="event-busy" size={20} color={colors.warning} />}
              />
            </View>
          </View>

          <AppCard style={styles.card}>
            <AppSectionHeader title="حالة الوردية" action={
              data.activeShift ? <AppBadge label="مفتوحة" tone="success" /> : undefined
            } />
            {data.activeShift ? (
              <View style={styles.shiftInfo}>
                <View style={styles.shiftRow}>
                  <MaterialIcons name="schedule" size={16} color={colors.textMuted} />
                  <Text style={styles.shiftText}>افتتحت: {dateText(String(data.activeShift.opened_at ?? ''))}</Text>
                </View>
                <View style={styles.shiftRow}>
                  <MaterialIcons name="account-balance-wallet" size={16} color={colors.textMuted} />
                  <Text style={styles.shiftText}>النقدية المتوقعة: {money(data.activeShift.expected_cash ?? data.activeShift.starting_cash ?? 0)}</Text>
                </View>
              </View>
            ) : (
              <AppEmptyState title="لا توجد وردية نشطة" message="افتح وردية من الخزنة لتفعيل نقطة البيع." />
            )}
          </AppCard>

          <AppCard style={styles.card}>
            <AppSectionHeader title="إجراءات سريعة" />
            <View style={styles.quickGrid}>
              <QuickAction icon="point-of-sale" label="نقطة البيع" description="بيع ومنتجات" onPress={() => navigation.navigate('POSTab')} color={colors.accent} />
              <QuickAction icon="inventory-2" label="المنتجات" description="بحث ومخزون" onPress={() => navigation.navigate('ProductsTab')} color={colors.success} />
              <QuickAction icon="receipt-long" label="المبيعات" description="فواتير" onPress={() => navigation.navigate('SalesTab')} color={colors.warning} />
              <QuickAction icon="apps" label="المزيد" description="جميع الأقسام" onPress={() => navigation.navigate('MoreTab')} color={colors.info} />
            </View>
          </AppCard>

          <AppCard style={styles.card}>
            <AppSectionHeader
              title="تنبيهات المخزون"
              action={data.lowStock.length > 0 ? <AppBadge label={`${numberText(data.lowStock.length)} تنبيه`} tone="danger" /> : undefined}
            />
            {data.lowStock.length === 0 ? (
              <AppEmptyState title="لا توجد تنبيهات مخزون" message="جميع الأصناف فوق الحد الأدنى." />
            ) : (
              data.lowStock.slice(0, 5).map((row, index) => (
                <AppListItem
                  key={String(row.id ?? row.product_id ?? index)}
                  title={String(row.product_name ?? row.name ?? (row.product as any)?.name ?? 'منتج')}
                  subtitle={`الكمية: ${numberText(row.quantity ?? row.stock_quantity ?? 0)}`}
                  badge={<AppBadge label="منخفض" tone="warning" />}
                />
              ))
            )}
          </AppCard>

          {data.expiryAlerts.length > 0 ? (
            <AppCard style={styles.card}>
              <AppSectionHeader title="صلاحية قريبة" action={<AppBadge label={numberText(data.expiryAlerts.length)} tone="warning" />} />
              {data.expiryAlerts.map((row, index) => (
                <AppListItem
                  key={String(row.batch_id ?? index)}
                  title={String(row.product_name ?? 'منتج')}
                  subtitle={String(row.warehouse_name ?? 'مخزن')}
                  meta={`${numberText(row.days_to_expiry)} يوم`}
                  metaLtr
                  badge={<AppBadge label={String(row.status ?? 'تنبيه')} tone="warning" />}
                />
              ))}
            </AppCard>
          ) : null}

          <AppCard style={styles.card}>
            <AppSectionHeader title="آخر المبيعات" />
            {data.recentSales.length === 0 ? (
              <AppEmptyState title="لا توجد بيانات" />
            ) : (
              data.recentSales.slice(0, 5).map((sale, index) => (
                <AppListItem
                  key={String(sale.id ?? index)}
                  title={String(sale.invoice_number ?? sale.id)}
                  subtitle={dateText(String(sale.created_at ?? sale.sale_date ?? ''))}
                  meta={money(sale.total ?? 0)}
                  metaLtr
                />
              ))
            )}
          </AppCard>
        </>
      ) : null}
    </AppScreen>
  );
}

function QuickAction({ icon, label, description, onPress, color }: { icon: string; label: string; description: string; onPress: () => void; color: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickItem, pressed ? [styles.quickPressed, pressScale(true)] : undefined]}
    >
      <View style={[styles.quickIcon, { backgroundColor: `${color}18` }]}>
        <MaterialIcons name={icon as keyof typeof MaterialIcons.glyphMap} size={24} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickDesc}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
  },
  statsGrid: { ...flexRow, flexWrap: 'wrap', gap: spacing.md },
  card: { gap: spacing.md },
  shiftInfo: { gap: spacing.sm },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  shiftText: {
    ...textStart,
    color: colors.textMuted,
    fontSize: typography.small,
    fontFamily: fonts.medium,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickItem: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  quickPressed: { backgroundColor: colors.surfaceMuted },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: typography.small,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.text,
  },
  quickDesc: {
    fontSize: typography.tiny,
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
});
