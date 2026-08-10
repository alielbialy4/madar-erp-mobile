import React, { useMemo } from 'react';
import { View , useWindowDimensions } from 'react-native';
import { AppBadge } from '@/components/ui';
import { AppErrorState } from '@/components/feedback';
import { DashboardHero } from './DashboardHero';
import { DashboardKpiCard } from './DashboardKpiCard';
import { DashboardScopePill } from './DashboardScopePill';
import { RevenueTrendChart } from './RevenueTrendChart';
import { TopProductsChart } from './TopProductsChart';
import { BranchPerformanceChart } from './BranchPerformanceChart';
import { DashboardDataTable, StockStatusBadge } from './DashboardDataTable';
import { DashboardSkeleton } from './DashboardSkeleton';
import { createDashboardStyles } from './dashboardStyles';
import { useColors } from '@/hooks/useColors';
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
};

type Props = {
  data: GlobalAnalyticsPayload | null;
  loading: boolean;
  error: string | null;
  shell: Shell;
  onRetry: () => void;
};

export function GlobalDashboardView({ data, loading, error, shell, onRetry }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const ds = useMemo(() => createDashboardStyles(c), [c]);

  if (loading && !data) {
    return (
      <View style={ds.page}>
        <DashboardHero
          title="لوحة التحكم الشاملة"
          subtitle="جاري تحميل مؤشرات النظام…"
          lastUpdatedLabel={shell.lastUpdatedLabel}
          isLoading
          onRefresh={shell.onRefresh}
        />
        <DashboardSkeleton variant="global" />
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
  const topProducts = d.top_products ?? [];
  const lowStock = d.low_stock_products ?? [];

  const scopeBadges = (
    <>
      <DashboardScopePill variant="hero" label="النطاق العام" dotColor={c.info} />
      <DashboardScopePill
        variant="hero"
        label={`${numberText(overview.branches_count ?? 0)} فرع نشط`}
        dotColor={c.accent}
      />
    </>
  );

  return (
    <View style={ds.page}>
      <DashboardHero
        title="لوحة التحكم الشاملة"
        subtitle="مركز العمليات — إيرادات ومبيعات الفروع، الاتجاهات، وأهم التنبيهات."
        scopeBadges={scopeBadges}
        lastUpdatedLabel={shell.lastUpdatedLabel}
        isLoading={shell.isLoading}
        onRefresh={shell.onRefresh}
      />

      <Text style={ds.sectionLabel}>المؤشرات الرئيسية</Text>
      <View style={ds.kpiGridPrimary}>
        <DashboardKpiCard label="إجمالي الإيرادات" value={money(overview.total_revenue ?? 0)} icon="wallet" tone="success" index={0} />
        <DashboardKpiCard label="إيرادات اليوم" value={money(overview.today_revenue ?? 0)} icon="payments" tone="success" index={1} />
        <DashboardKpiCard label="إيرادات الشهر" value={money(overview.month_revenue ?? 0)} icon="calendar-blank" tone="info" index={2} />
        <DashboardKpiCard label="مبيعات اليوم" value={numberText(overview.today_sales ?? 0)} icon="storefront" tone="success" index={3} />
      </View>

      <Text style={ds.sectionLabel}>مؤشرات تشغيلية</Text>
      <View style={ds.kpiGridSecondary}>
        <DashboardKpiCard tier="secondary" label="إجمالي المبيعات" value={numberText(overview.total_sales ?? 0)} icon="shopping-bag" tone="warning" index={4} />
        <DashboardKpiCard tier="secondary" label="العملاء" value={numberText(overview.total_customers ?? 0)} icon="people" tone="info" index={5} />
        <DashboardKpiCard tier="secondary" label="المنتجات" value={numberText(overview.total_products ?? 0)} icon="inventory-2" tone="info" index={6} />
        <DashboardKpiCard tier="secondary" label="المشتريات" value={numberText(overview.total_purchases ?? 0)} icon="shopping-cart" tone="warning" index={7} />
        <DashboardKpiCard tier="secondary" label="مصروفات الشهر" value={money(overview.month_expenses ?? 0)} icon="receipt" tone="danger" index={8} />
        <DashboardKpiCard tier="secondary" label="عدد الفروع" value={numberText(overview.branches_count ?? 0)} icon="business" tone="neutral" index={9} />
      </View>

      <View style={isTablet ? ds.widgetGridTablet : ds.widgetStack}>
        <View style={isTablet ? ds.widgetMain : undefined}>
          <RevenueTrendChart
            days={trend.days ?? []}
            revenue={(trend.revenue ?? []).map((n) => Number(n ?? 0))}
            title="اتجاه الإيرادات"
            hint="مقارنة الإيرادات على مستوى النظام — آخر 30 يومًا."
            badge="30 يوم"
            variant="line"
          />
        </View>
        <View style={isTablet ? ds.widgetSide : undefined}>
          <TopProductsChart products={topProducts as { product_name?: string; name?: string; total_sold?: number }[]} />
        </View>
      </View>

      {branchPerf.length > 0 ? (
        <>
          <BranchPerformanceChart branches={branchPerf} />
          <DashboardDataTable
            title="مقارنة الفروع"
            hint="مبيعات وإيرادات وورديات نشطة"
            badge={`${branchPerf.length} فرع`}
            columns={[
              { key: 'name', label: 'الفرع', flex: 1.2 },
              { key: 'today_sales', label: 'مبيعات اليوم', align: 'center', width: 96 },
              { key: 'today_revenue', label: 'إيراد اليوم', align: 'center', width: 104 },
              { key: 'month_revenue', label: 'إيراد الشهر', align: 'center', width: 104 },
              { key: 'active_shifts', label: 'ورديات', align: 'center', width: 72 },
            ]}
            rows={branchPerf.map((b) => ({
              name: String(b.name ?? '—'),
              today_sales: numberText(b.today_sales ?? 0),
              today_revenue: money(b.today_revenue ?? 0),
              month_revenue: money(b.month_revenue ?? 0),
              active_shifts: (
                <AppBadge
                  label={numberText(b.active_shifts ?? 0)}
                  tone={Number(b.active_shifts ?? 0) > 0 ? 'success' : 'neutral'}
                />
              ),
            }))}
            footerHint={branchPerf.length === 1 ? 'فرع واحد فقط — أضف فروعًا لمقارنة أوضح.' : undefined}
          />
        </>
      ) : null}

      {lowStock.length > 0 ? (
        <DashboardDataTable
          title="تنبيهات المخزون"
          hint="منتجات منخفضة أو نافدة عبر الفروع"
          badge={`${lowStock.length}`}
          badgeTone="warning"
          columns={[
            { key: 'name', label: 'المنتج', flex: 1.2 },
            { key: 'qty', label: 'الكمية', align: 'center', width: 80 },
            { key: 'threshold', label: 'حد التنبيه', align: 'center', width: 96 },
            { key: 'status', label: 'الحالة', align: 'center', width: 88 },
          ]}
          rows={lowStock.map((p) => {
            const qty = Number(p.stock_quantity ?? 0);
            return {
              name: String(p.name ?? '—'),
              qty: numberText(qty),
              threshold: numberText(p.min_stock_alert ?? 0),
              status: <StockStatusBadge quantity={qty} />,
            };
          })}
        />
      ) : null}
    </View>
  );
}
