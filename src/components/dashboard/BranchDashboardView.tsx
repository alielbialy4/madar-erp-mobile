import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppErrorState } from '@/components/feedback';
import { AttentionBand, MadarSection, MetricBlock } from '@/components/madar';
import { DashboardHero } from './DashboardHero';
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
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
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
  const activeTables = Number((dining as { active_tables?: number }).active_tables ?? 0);
  const totalTables = Number((dining as { total_tables?: number }).total_tables ?? 0);

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
  const navigateProducts = () => navigation.navigate('ProductsTab');

  const attentionItems = [
    !shift
      ? {
          id: 'no-shift',
          title: 'لا توجد وردية مفتوحة',
          detail: 'افتح وردية قبل متابعة عمليات نقاط البيع.',
          tone: 'warning' as const,
          onPress: navigateShifts,
        }
      : null,
    lowStock.length > 0
      ? {
          id: 'low-stock',
          title: `${numberText(lowStock.length)} منتج بمخزون منخفض`,
          detail: 'راجع حدود التنبيه قبل نفاد المخزون.',
          tone: 'warning' as const,
          onPress: navigateProducts,
        }
      : null,
    totalTables > 0 && activeTables / totalTables >= 0.85
      ? {
          id: 'dining-pressure',
          title: 'قاعة شبه ممتلئة',
          detail: `${numberText(activeTables)} / ${numberText(totalTables)} طاولة نشطة`,
          tone: 'info' as const,
        }
      : null,
  ].filter(Boolean) as {
    id: string;
    title: string;
    detail?: string;
    tone?: 'warning' | 'danger' | 'info';
    onPress?: () => void;
  }[];

  return (
    <View style={ds.page}>
      <DashboardHero
        title="لوحة تشغيل الفرع"
        subtitle="إيراد اليوم أولاً — ثم الاستثناءات والوردية والاتجاه."
        scopeBadges={scopeBadges}
        lastUpdatedLabel={shell.lastUpdatedLabel}
        isLoading={shell.isLoading}
        onRefresh={shell.onRefresh}
      />

      <MadarSection title="نبض اليوم">
        <MetricBlock
          label="إيرادات اليوم"
          value={money(revenue)}
          hint={`${numberText(salesCount)} عملية · متوسط ${money(avgOrder)}`}
          level="A"
          tone="positive"
        />
        <View style={styles.secondaryRow}>
          <MetricBlock
            label="مبيعات اليوم"
            value={numberText(salesCount)}
            level="C"
            style={styles.secondaryMetric}
          />
          <MetricBlock
            label="إيرادات الشهر"
            value={money(monthRev)}
            level="C"
            style={styles.secondaryMetric}
          />
        </View>
      </MadarSection>

      <AttentionBand items={attentionItems} />

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

const styles = StyleSheet.create({
  secondaryRow: {
    ...flexRow,
    gap: spacing.md,
  },
  secondaryMetric: {
    flex: 1,
  },
});
