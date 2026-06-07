import React, { useMemo } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppButton } from '@/components/ui';
import { AppEmptyState, AppErrorState } from '@/components/feedback';
import { DashboardHero } from './DashboardHero';
import { DashboardKpiCard } from './DashboardKpiCard';
import { DashboardScopePill } from './DashboardScopePill';
import { RevenueTrendChart } from './RevenueTrendChart';
import { DashboardListCard } from './DashboardListCard';
import { DashboardSection } from './DashboardSection';
import { DashboardAlerts } from './DashboardAlerts';
import { createDashboardStyles } from './dashboardStyles';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { money, numberText } from '@/utils/format';
import { parseApiMoneyFirst } from '@/utils/parseMoney';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/types/navigation';
import { Text } from '@/components/ui/AppText';

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
  quickActions: React.ReactNode;
  greeting?: string;
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
  const ds = useMemo(() => createDashboardStyles(c), [c]);

  if (loading && !data) {
    return (
      <View style={ds.page}>
        <DashboardHero
          title={shell.greeting ?? 'لوحة تشغيل الفرع'}
          subtitle="جاري تحميل مؤشرات الفرع…"
          lastUpdatedLabel={shell.lastUpdatedLabel}
          isLoading
          onRefresh={shell.onRefresh}
          quickActions={shell.quickActions}
        />
        <AppEmptyState title="جاري التحميل" message="يتم جلب البيانات من الخادم" />
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
      <DashboardScopePill label={`${branch.name ?? '—'} · ${branch.code ?? '—'}`} dotColor={c.accent} />
      <DashboardScopePill
        label={branch.status === 'active' ? 'فرع نشط' : 'غير نشط'}
        dotColor={branch.status === 'active' ? c.success : c.danger}
      />
      <DashboardScopePill
        label={shift ? 'وردية مفتوحة' : 'لا وردية'}
        dotColor={shift ? c.success : c.warning}
      />
    </>
  );

  const alerts = lowStock.slice(0, 5).map((p) => ({
    id: `stock-${p.id ?? p.name}`,
    title: String(p.name ?? 'منتج'),
    subtitle: `الكمية: ${numberText(p.stock_quantity ?? 0)} · حد: ${numberText(p.min_stock_alert ?? 0)}`,
    icon: 'package',
    tone: (Number(p.stock_quantity ?? 0) <= 0 ? 'danger' : 'warning') as 'danger' | 'warning',
    meta: Number(p.stock_quantity ?? 0) <= 0 ? 'نفد' : 'منخفض',
  }));

  return (
    <View style={ds.page}>
      <DashboardHero
        eyebrow="تشغيل الفرع"
        title={shell.greeting ?? 'لوحة تشغيل الفرع'}
        subtitle="مبيعات اليوم، الوردية، والتنبيهات — كل ما تحتاجه في شاشة واحدة."
        scopeBadges={scopeBadges}
        lastUpdatedLabel={shell.lastUpdatedLabel}
        isLoading={shell.isLoading}
        onRefresh={shell.onRefresh}
        quickActions={shell.quickActions}
      />

      {/* Hero KPIs */}
      <DashboardSection title="ملخص اليوم" icon="lightning" iconTone="success">
        <View style={ds.kpiGrid}>
          <DashboardKpiCard
            wide
            label="إيرادات اليوم"
            value={money(revenue)}
            hint={`${numberText(salesCount)} عملية بيع`}
            icon="wallet"
            tone="success"
            index={0}
          />
          <DashboardKpiCard label="مبيعات اليوم" value={numberText(salesCount)} icon="storefront" tone="accent" index={1} />
          <DashboardKpiCard label="متوسط الطلب" value={money(avgOrder)} icon="tag" tone="info" index={2} />
          <DashboardKpiCard label="إيرادات الشهر" value={money(monthRev)} icon="calendar-blank" tone="neutral" index={3} />
        </View>
      </DashboardSection>

      {/* Dining highlight card */}
      {dining.total_tables ? (
        <View style={{ marginHorizontal: spacing.lg }}>
          <LinearGradient
            colors={['#F59E0B', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              shadowColor: '#F59E0B',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.20,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22, fontFamily: fonts.extraBold, color: '#FFFFFF' }}>
                {numberText(dining.active_tables ?? 0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.80)' }}>
                صالة الطعام
              </Text>
              <Text style={{ fontSize: 18, fontFamily: fonts.extraBold, color: '#FFFFFF' }}>
                {numberText(dining.active_tables ?? 0)} طاولات مشغولة
              </Text>
              <Text style={{ fontSize: 11, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.70)', marginTop: 2 }}>
                من إجمالي {numberText(dining.total_tables ?? 0)} طاولات
              </Text>
            </View>
          </LinearGradient>
        </View>
      ) : null}

      {/* Revenue trend */}
      <RevenueTrendChart days={trend.days ?? []} revenue={(trend.revenue ?? []).map((n) => Number(n ?? 0))} />

      {/* Alerts */}
      {alerts.length > 0 ? <DashboardAlerts alerts={alerts} /> : null}

      {/* Shift section */}
      <DashboardSection
        title="الوردية الحالية"
        hint="ملخص الوردية المفتوحة"
        icon="clock"
        iconTone="info"
        badge={shift ? 'نشطة' : 'مغلقة'}
        badgeTone={shift ? 'success' : 'warning'}
      >
        <View style={ds.surfaceCard}>
          {shift ? (
            <>
              <DetailRow ds={ds} label="وقت الفتح" value={String(shift.opened_at ?? '—')} />
              <DetailRow ds={ds} label="الكاشير" value={String(shift.cashier_name ?? '—')} />
              <DetailRow ds={ds} label="الخزنة" value={String(shift.vault_name ?? '—')} />
              <DetailRow
                ds={ds}
                label="رصيد الخزنة"
                value={money(
                  parseApiMoneyFirst(
                    (shift.vault as { balance?: unknown })?.balance,
                    shift.vault,
                    shift.vault_current_balance,
                  ) ?? 0,
                )}
              />
              <DetailRow ds={ds} label="رصيد البداية" value={money(shift.starting_cash ?? 0)} />
              <DetailRow
                ds={ds}
                label="فواتير مكتملة"
                value={`${numberText(shift.completed_sales_count ?? 0)} · ${money(shift.completed_sales_total ?? 0)}`}
              />
              <DetailRow
                ds={ds}
                label="نقدي للدرج"
                value={`${numberText(shift.cash_sales_count ?? 0)} · ${money(shift.cash_sales_total ?? 0)}`}
                last
              />
            </>
          ) : (
            <View style={[ds.emptyBox, { gap: spacing.md }]}>
              <Text style={ds.emptyText}>لا توجد وردية مفتوحة على هذا الفرع</Text>
              <AppButton
                title="فتح وردية"
                size="sm"
                onPress={() => navigation.navigate('MoreTab', { screen: 'ShiftManagement' })}
              />
            </View>
          )}
        </View>
      </DashboardSection>

      {/* Recent sales */}
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
  );
}

function DetailRow({
  ds,
  label,
  value,
  last,
}: {
  ds: ReturnType<typeof createDashboardStyles>;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[ds.detailRow, last && { borderBottomWidth: 0 }]}>
      <Text style={ds.detailLabel}>{label}</Text>
      <Text style={ds.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
