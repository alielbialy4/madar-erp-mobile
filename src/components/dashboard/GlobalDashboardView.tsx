import React, { useMemo } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppEmptyState, AppErrorState } from '@/components/feedback';
import { DashboardHero } from './DashboardHero';
import { DashboardKpiCard } from './DashboardKpiCard';
import { DashboardScopePill } from './DashboardScopePill';
import { RevenueTrendChart } from './RevenueTrendChart';
import { DashboardListCard } from './DashboardListCard';
import { DashboardSection } from './DashboardSection';
import { DashboardDonutChart } from './DashboardDonutChart';
import { DashboardBarChart } from './DashboardBarChart';
import { DashboardAlerts } from './DashboardAlerts';
import { createDashboardStyles } from './dashboardStyles';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { money, numberText } from '@/utils/format';
import { Text } from '@/components/ui/AppText';

export type GlobalAnalyticsPayload = Record<string, unknown> & {
  error?: string;
  overview?: Record<string, unknown>;
  branch_performance?: Record<string, unknown>[];
  revenue_trend?: { days?: string[]; revenue?: number[] };
  top_products?: Record<string, unknown>[];
  low_stock_products?: Record<string, unknown>[];
};

type Shell = {
  lastUpdatedLabel: string;
  isLoading: boolean;
  onRefresh: () => void;
  quickActions: React.ReactNode;
  greeting?: string;
};

type Props = {
  data: GlobalAnalyticsPayload | null;
  loading: boolean;
  error: string | null;
  shell: Shell;
  onRetry: () => void;
};

const BRANCH_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6'];

export function GlobalDashboardView({ data, loading, error, shell, onRetry }: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);

  if (loading && !data) {
    return (
      <View style={ds.page}>
        <DashboardHero
          eyebrow="النطاق العام"
          title={shell.greeting ?? 'لوحة التحكم الشاملة'}
          subtitle="جاري تحميل مؤشرات النظام…"
          lastUpdatedLabel={shell.lastUpdatedLabel}
          isLoading
          onRefresh={shell.onRefresh}
          quickActions={shell.quickActions}
        />
        <AppEmptyState title="جاري التحميل" message="يتم جلب التحليلات من الخادم" />
      </View>
    );
  }

  if (error && !data) {
    return <AppErrorState message={error} onRetry={onRetry} />;
  }

  const d = data ?? {};
  if (d.error) {
    return <AppErrorState message={String(d.error)} onRetry={onRetry} />;
  }

  const overview = d.overview ?? {};
  const trend = d.revenue_trend ?? {};
  const branchPerf = d.branch_performance ?? [];
  const topProducts = (d.top_products ?? []).slice(0, 8);
  const lowStock = d.low_stock_products ?? [];

  const scopeBadges = (
    <>
      <DashboardScopePill label="النطاق العام" dotColor={c.info} />
      <DashboardScopePill
        label={`${numberText(overview.branches_count ?? 0)} فرع نشط`}
        dotColor={c.accent}
      />
    </>
  );

  // Build alerts
  const alerts = lowStock.slice(0, 5).map((p) => ({
    id: `stock-${p.id ?? p.name}`,
    title: String(p.name ?? 'منتج'),
    subtitle: `الكمية: ${numberText(p.stock_quantity ?? 0)}`,
    icon: 'package',
    tone: (Number(p.stock_quantity ?? 0) <= 0 ? 'danger' : 'warning') as 'danger' | 'warning',
    meta: Number(p.stock_quantity ?? 0) <= 0 ? 'نفد' : 'منخفض',
  }));

  // Build donut data (revenue by branch)
  const donutData = branchPerf.slice(0, 6).map((b, i) => ({
    label: String(b.name ?? 'فرع'),
    value: Number(b.today_revenue ?? 0),
    color: BRANCH_COLORS[i % BRANCH_COLORS.length],
  }));

  // Build bar chart data (branch comparison)
  const barData = branchPerf.slice(0, 6).map((b) => ({
    label: String(b.code ?? b.name ?? 'فرع'),
    value: Number(b.today_revenue ?? 0),
  }));

  // Calculate trends
  const todayRev = Number(overview.today_revenue ?? 0);
  const monthRev = Number(overview.month_revenue ?? 0);
  const monthExp = Number(overview.month_expenses ?? 0);
  const profit = monthRev - monthExp;
  const margin = monthRev > 0 ? Math.round((profit / monthRev) * 100) : 0;

  return (
    <View style={ds.page}>
      <DashboardHero
        eyebrow="النطاق العام"
        title={shell.greeting ?? 'لوحة التحكم الشاملة'}
        subtitle="مركز العمليات — إيرادات ومبيعات الفروع، الاتجاهات، وأهم التنبيهات."
        scopeBadges={scopeBadges}
        lastUpdatedLabel={shell.lastUpdatedLabel}
        isLoading={shell.isLoading}
        onRefresh={shell.onRefresh}
        quickActions={shell.quickActions}
      />

      {/* Hero KPI — إجمالي الإيرادات */}
      <DashboardSection title="ملخص اليوم" icon="lightning" iconTone="success">
        <View style={ds.kpiGrid}>
          <DashboardKpiCard
            wide
            label="إجمالي الإيرادات"
            value={money(overview.total_revenue ?? 0)}
            hint={`${numberText(overview.total_sales ?? 0)} عملية بيع`}
            icon="currency-circle-dollar"
            tone="success"
            index={0}
          />
          <DashboardKpiCard
            label="إيرادات اليوم"
            value={money(todayRev)}
            hint={`${numberText(overview.today_sales ?? 0)} مبيعة`}
            icon="wallet"
            tone="success"
            index={1}
          />
          <DashboardKpiCard label="إيرادات الشهر" value={money(monthRev)} icon="calendar-blank" tone="info" index={2} />
          <DashboardKpiCard label="مصروفات الشهر" value={money(monthExp)} icon="receipt" tone="warning" index={3} />
        </View>
      </DashboardSection>

      {/* Profit highlight card */}
      <View style={{ marginHorizontal: spacing.lg }}>
        <LinearGradient
          colors={profit >= 0 ? ['#10B981', '#06B6D4'] : ['#EF4444', '#F43F5E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            shadowColor: profit >= 0 ? '#10B981' : '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.20,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, fontFamily: fonts.extraBold, color: '#FFFFFF' }}>
              {margin}%
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.80)' }}>
              {profit >= 0 ? 'صافي ربح الشهر' : 'خسارة الشهر'}
            </Text>
            <Text style={{ fontSize: 20, fontFamily: fonts.extraBold, color: '#FFFFFF' }}>
              {money(Math.abs(profit))}
            </Text>
            <Text style={{ fontSize: 11, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.70)', marginTop: 2 }}>
              هامش {margin}% • إيراد {money(monthRev)} • مصروف {money(monthExp)}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Operational KPIs */}
      <DashboardSection title="مؤشرات تشغيلية" icon="gear-six" iconTone="accent">
        <View style={ds.kpiGrid}>
          <DashboardKpiCard label="إجمالي المبيعات" value={numberText(overview.total_sales ?? 0)} icon="storefront" tone="accent" index={4} />
          <DashboardKpiCard label="العملاء" value={numberText(overview.total_customers ?? 0)} icon="users" tone="info" index={5} />
          <DashboardKpiCard label="المنتجات" value={numberText(overview.total_products ?? 0)} icon="package" tone="neutral" index={6} />
          <DashboardKpiCard label="المشتريات" value={numberText(overview.total_purchases ?? 0)} icon="shopping-cart" tone="neutral" index={7} />
        </View>
      </DashboardSection>

      {/* Revenue trend chart */}
      <RevenueTrendChart
        days={trend.days ?? []}
        revenue={(trend.revenue ?? []).map((n) => Number(n ?? 0))}
        title="اتجاه الإيرادات (عام)"
        hint="مقارنة الإيرادات على مستوى النظام — آخر 14 يومًا."
      />

      {/* Alerts */}
      {alerts.length > 0 ? (
        <DashboardAlerts alerts={alerts} />
      ) : null}

      {/* Branch revenue donut */}
      {donutData.length > 0 ? (
        <DashboardDonutChart
          title="توزيع إيرادات اليوم"
          hint="حسب الفرع"
          data={donutData}
          centerLabel="فرع"
          centerValue={String(branchPerf.length)}
        />
      ) : null}

      {/* Branch performance bar chart */}
      {barData.length > 0 ? (
        <DashboardBarChart
          title="أداء الفروع"
          hint="إيرادات اليوم لكل فرع"
          data={barData}
          icon="buildings"
          iconTone="accent"
        />
      ) : null}

      {/* Branch list */}
      <DashboardListCard
        title="أداء الفروع"
        hint="إيرادات اليوم لكل فرع"
        sectionIcon="storefront"
        badge={`${branchPerf.length} فرع`}
        items={branchPerf.map((b, i) => ({
          id: String(b.id ?? i),
          title: String(b.name ?? 'فرع'),
          subtitle: String(b.code ?? ''),
          meta: money(b.today_revenue ?? 0),
          icon: 'storefront',
          iconTone: 'accent',
        }))}
        emptyMessage="لا توجد بيانات فروع."
      />

      {/* Top products */}
      {topProducts.length > 0 ? (
        <DashboardListCard
          title="أفضل المنتجات"
          hint="حسب الإيراد"
          sectionIcon="trophy"
          badge={`${topProducts.length}`}
          badgeTone="success"
          items={topProducts.map((p, i) => ({
            id: String(p.product_id ?? i),
            title: String(p.name ?? p.product_name ?? '—'),
            meta: money(p.revenue ?? p.total ?? 0),
            icon: 'star',
            iconTone: 'success',
          }))}
          emptyMessage=""
        />
      ) : null}
    </View>
  );
}
