import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { AppErrorState } from '@/components/feedback';
import { DashboardHero } from './DashboardHero';
import { DashboardKpiCard } from './DashboardKpiCard';
import { DashboardScopePill } from './DashboardScopePill';
import { RevenueTrendChart } from './RevenueTrendChart';
import { DashboardListCard } from './DashboardListCard';
import { DashboardDataTable, StockStatusBadge } from './DashboardDataTable';
import { DashboardShiftPanel } from './DashboardShiftPanel';
import { DashboardDiningPanel } from './DashboardDiningPanel';
import { DashboardSkeleton } from './DashboardSkeleton';
import { createDashboardStyles } from './dashboardStyles';
import { useColors } from '@/hooks/useColors';
import { money, numberText } from '@/utils/format';
import { Text } from '@/components/ui/AppText';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/types/navigation';

export type BranchOperationalPayload = Record<string, unknown> & {
  error?: string;
  branch?: { name?: string; code?: string; status?: string };
  current_shift?: Record<string, unknown> | null;
  kpis?: Record<string, unknown>;
  dining?: Record<string, unknown>;
  low_stock?: Record<string, unknown>[];
  recent_sales?: Record<string, unknown>[];
  revenue_trend?: { days?: string[]; revenue?: number[] };
};

type Shell = {
  lastUpdatedLabel: string;
  isLoading: boolean;
  onRefresh: () => void;
};

type Props = {
  data: BranchOperationalPayload | null;
  loading: boolean;
  error: string | null;
  shell: Shell;
  navigation: BottomTabNavigationProp<MainTabParamList>;
  onRetry: () => void;
};

export function BranchDashboardView({ data, loading, error, shell, navigation, onRetry }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const ds = useMemo(() => createDashboardStyles(c), [c]);

  if (loading && !data) {
    return (
      <View style={ds.page}>
        <DashboardHero
          title="لوحة تشغيل الفرع"
          subtitle="جاري تحميل مؤشرات الفرع…"
          lastUpdatedLabel={shell.lastUpdatedLabel}
          isLoading
          onRefresh={shell.onRefresh}
        />
        <DashboardSkeleton variant="branch" />
      </View>
    );
  }

  if (error && !data) {
    return <AppErrorState message={error} onRetry={onRetry} />;
  }

  const d = data ?? {};
  if (d.error) {
    const msg = d.error === 'Branch not found' ? 'الفرع غير موجود' : String(d.error);
    return <AppErrorState message={msg} onRetry={onRetry} />;
  }

  const branch = d.branch ?? {};
  const shift = d.current_shift;
  const kpis = d.kpis ?? {};
  const dining = d.dining ?? {};
  const lowStock = d.low_stock ?? [];
  const recentSales = d.recent_sales ?? [];
  const trend = d.revenue_trend ?? {};
  const salesCount = Number(kpis.today_sales ?? 0) || 0;
  const revenue = Number(kpis.today_revenue ?? 0) || 0;
  const avgOrder = salesCount ? revenue / salesCount : 0;
  const monthRev = Number(kpis.month_revenue ?? 0);

  const scopeBadges = (
    <>
      <DashboardScopePill variant="hero" label={`${branch.name ?? '—'} · ${branch.code ?? '—'}`} dotColor={c.accent} />
      <DashboardScopePill
        variant="hero"
        label={branch.status === 'active' ? 'فرع نشط' : 'غير نشط'}
        dotColor={branch.status === 'active' ? c.success : c.danger}
      />
      <DashboardScopePill
        variant="hero"
        label={shift ? 'وردية مفتوحة' : 'لا وردية'}
        dotColor={shift ? c.success : c.warning}
      />
    </>
  );

  const navigateShifts = () => navigation.navigate('MoreTab', { screen: 'ShiftManagement' });

  return (
    <View style={ds.page}>
      <DashboardHero
        title="لوحة تشغيل الفرع"
        subtitle="مبيعات اليوم، الوردية، والتنبيهات — كل ما تحتاجه في شاشة واحدة."
        scopeBadges={scopeBadges}
        lastUpdatedLabel={shell.lastUpdatedLabel}
        isLoading={shell.isLoading}
        onRefresh={shell.onRefresh}
      />

      <Text style={ds.sectionLabel}>مؤشرات اليوم</Text>
      <View style={ds.kpiGridPrimary}>
        <DashboardKpiCard label="إيرادات اليوم" value={money(revenue)} hint={`${numberText(salesCount)} عملية`} icon="wallet" tone="success" index={0} />
        <DashboardKpiCard label="مبيعات اليوم" value={numberText(salesCount)} icon="storefront" tone="accent" index={1} />
        <DashboardKpiCard label="متوسط الطلب" value={money(avgOrder)} icon="sell" tone="info" index={2} />
        <DashboardKpiCard label="إيرادات الشهر" value={money(monthRev)} icon="calendar-blank" tone="neutral" index={3} />
      </View>

      <View style={isTablet ? ds.widgetGridTablet : ds.widgetStack}>
        <View style={isTablet ? ds.widgetMain : undefined}>
          <RevenueTrendChart
            days={trend.days ?? []}
            revenue={(trend.revenue ?? []).map((n) => Number(n ?? 0))}
            title="اتجاه الإيرادات"
            hint="آخر 14 يومًا على مستوى الفرع."
            badge="14 يوم"
            variant="line"
            compact
          />
        </View>
        <View style={isTablet ? ds.widgetSide : undefined}>
          <DashboardShiftPanel shift={shift} onOpenShift={navigateShifts} onManageShifts={navigateShifts} />
          <DashboardDiningPanel dining={dining as { active_tables?: number; total_tables?: number }} />
        </View>
      </View>

      {!isTablet ? (
        <>
          <DashboardShiftPanel shift={shift} onOpenShift={navigateShifts} onManageShifts={navigateShifts} />
          <DashboardDiningPanel dining={dining as { active_tables?: number; total_tables?: number }} />
        </>
      ) : null}

      <View style={isTablet ? ds.dataGridTablet : undefined}>
        <View style={isTablet ? ds.dataGridCell : undefined}>
          <DashboardListCard
            title="آخر المبيعات"
            hint="أحدث العمليات على الفرع"
            sectionIcon="receipt"
            badge={`${recentSales.length} سجل`}
            items={recentSales.map((s, i) => ({
              id: String(s.id ?? i),
              title: String(s.invoice_number ?? s.id ?? '—'),
              subtitle: String(s.customer_name ?? 'عميل نقدي'),
              meta: money(s.total ?? 0),
              badge: s.status === 'completed' ? 'مكتملة' : 'معلقة',
              badgeTone: s.status === 'completed' ? 'success' : 'warning',
              icon: 'receipt',
              iconTone: 'accent',
            }))}
            emptyMessage="لا توجد مبيعات حديثة."
          />
        </View>
        <View style={isTablet ? ds.dataGridCell : undefined}>
          <DashboardDataTable
            title="مخزون منخفض"
            hint="منتجات تحت حد التنبيه"
            badge={`${lowStock.length}`}
            badgeTone="warning"
            columns={[
              { key: 'name', label: 'المنتج', flex: 1.2 },
              { key: 'qty', label: 'الكمية', align: 'center', width: 80 },
              { key: 'threshold', label: 'الحد', align: 'center', width: 80 },
              { key: 'status', label: 'الحالة', align: 'center', width: 88 },
            ]}
            rows={
              lowStock.length > 0
                ? lowStock.map((p) => {
                    const qty = Number(p.stock_quantity ?? 0);
                    return {
                      name: String(p.name ?? '—'),
                      qty: numberText(qty),
                      threshold: numberText(p.min_stock_alert ?? 0),
                      status: <StockStatusBadge quantity={qty} />,
                    };
                  })
                : [{ name: '—', qty: '—', threshold: '—', status: 'لا تنبيهات' }]
            }
            emptyMessage="لا توجد منتجات منخفضة."
          />
        </View>
      </View>
    </View>
  );
}
