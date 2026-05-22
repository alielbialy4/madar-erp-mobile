import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppEmptyState, AppErrorState } from '@/components/feedback';
import { DashboardHero } from './DashboardHero';
import { DashboardKpiCard } from './DashboardKpiCard';
import { DashboardScopePill } from './DashboardScopePill';
import { RevenueTrendChart } from './RevenueTrendChart';
import { DashboardListCard } from './DashboardListCard';
import { DashboardSection } from './DashboardSection';
import { createDashboardStyles } from './dashboardStyles';
import { useColors } from '@/hooks/useColors';
import { money, numberText } from '@/utils/format';

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

  return (
    <View style={ds.page}>
      <DashboardHero
        eyebrow="النطاق العام"
        title={shell.greeting ?? 'لوحة التحكم الشاملة'}
        subtitle="مركز العمليات — إيرادات ومبيعات الفروع، الاتجاهات، وأهم التنبيهات في لقطة واحدة."
        scopeBadges={scopeBadges}
        lastUpdatedLabel={shell.lastUpdatedLabel}
        isLoading={shell.isLoading}
        onRefresh={shell.onRefresh}
        quickActions={shell.quickActions}
      />

      <DashboardSection title="المؤشرات الرئيسية" icon="insights" iconTone="success">
        <View style={ds.kpiGrid}>
          <DashboardKpiCard
            wide
            label="إجمالي الإيرادات"
            value={money(overview.total_revenue ?? 0)}
            hint={`${numberText(overview.total_sales ?? 0)} عملية بيع`}
            icon="account-balance-wallet"
            tone="success"
          />
          <DashboardKpiCard
            label="إيرادات اليوم"
            value={money(overview.today_revenue ?? 0)}
            hint={`${numberText(overview.today_sales ?? 0)} مبيعة`}
            icon="attach-money"
            tone="success"
          />
          <DashboardKpiCard label="إيرادات الشهر" value={money(overview.month_revenue ?? 0)} icon="event" tone="info" />
          <DashboardKpiCard label="مصروفات الشهر" value={money(overview.month_expenses ?? 0)} icon="money-off" tone="warning" />
        </View>
      </DashboardSection>

      <DashboardSection title="مؤشرات تشغيلية" icon="dashboard" iconTone="accent">
        <View style={ds.kpiGrid}>
          <DashboardKpiCard label="إجمالي المبيعات" value={numberText(overview.total_sales ?? 0)} icon="shopping-bag" tone="accent" />
          <DashboardKpiCard label="العملاء" value={numberText(overview.total_customers ?? 0)} icon="people" tone="info" />
          <DashboardKpiCard label="المنتجات" value={numberText(overview.total_products ?? 0)} icon="inventory" tone="neutral" />
          <DashboardKpiCard label="المشتريات" value={numberText(overview.total_purchases ?? 0)} icon="local-shipping" tone="neutral" />
        </View>
      </DashboardSection>

      <RevenueTrendChart
        days={trend.days ?? []}
        revenue={(trend.revenue ?? []).map((n) => Number(n ?? 0))}
        title="اتجاه الإيرادات (عام)"
        hint="مقارنة الإيرادات على مستوى النظام — آخر 14 يومًا."
      />

      <DashboardListCard
        title="أداء الفروع"
        hint="إيرادات اليوم لكل فرع"
        sectionIcon="store"
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

      {topProducts.length > 0 ? (
        <DashboardListCard
          title="أفضل المنتجات"
          hint="حسب الإيراد"
          sectionIcon="star"
          badge={`${topProducts.length}`}
          badgeTone="success"
          items={topProducts.map((p, i) => ({
            id: String(p.product_id ?? i),
            title: String(p.name ?? p.product_name ?? '—'),
            meta: money(p.revenue ?? p.total ?? 0),
            icon: 'inventory-2',
            iconTone: 'success',
          }))}
          emptyMessage=""
        />
      ) : null}

      {lowStock.length > 0 ? (
        <DashboardListCard
          title="مخزون منخفض (عام)"
          hint="أصناف تحتاج متابعة على مستوى النظام"
          sectionIcon="warning"
          badge={String(lowStock.length)}
          badgeTone="warning"
          items={lowStock.map((p, i) => ({
            id: String(p.id ?? i),
            title: String(p.name ?? '—'),
            subtitle: `الكمية: ${numberText(p.stock_quantity ?? 0)}`,
            badge: Number(p.stock_quantity ?? 0) <= 0 ? 'نفد' : 'منخفض',
            badgeTone: Number(p.stock_quantity ?? 0) <= 0 ? 'danger' : 'warning',
            icon: 'inventory',
            iconTone: 'warning',
          }))}
          emptyMessage=""
        />
      ) : null}
    </View>
  );
}
