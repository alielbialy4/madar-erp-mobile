import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppScreen } from '@/components/layout';
import { AppButton, AppChip } from '@/components/ui';
import { reportsAPI } from '@/api/reports';
import { defaultReportFilters, useReport } from '@/hooks/useReport';
import type { ReportDefinition } from '@/reports/types';
import { ReportFilterSheet } from './ReportFilterSheet';
import { ReportFilterChips } from './ReportFilterChips';
import { ReportSummaryCards } from './ReportSummaryCards';
import { ReportListCards } from './ReportListCards';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useBranchStore } from '@/store/branchStore';
import { reportRows, reportSummary } from '@/utils/reportNormalizers';
import { useColors } from '@/hooks/useColors';

type LegacyTab =
  | 'comprehensive-sales'
  | 'comprehensive-purchases'
  | 'products'
  | 'customers'
  | 'suppliers'
  | 'employees'
  | 'payments'
  | 'profit-loss'
  | 'inventory';

const TABS: { id: LegacyTab; label: string; apiMethod: keyof typeof reportsAPI }[] = [
  { id: 'comprehensive-sales', label: 'مبيعات شاملة', apiMethod: 'comprehensiveSales' },
  { id: 'comprehensive-purchases', label: 'مشتريات شاملة', apiMethod: 'comprehensivePurchases' },
  { id: 'products', label: 'المنتجات', apiMethod: 'products' },
  { id: 'customers', label: 'العملاء', apiMethod: 'customers' },
  { id: 'suppliers', label: 'الموردون', apiMethod: 'suppliers' },
  { id: 'employees', label: 'الموظفون', apiMethod: 'employees' },
  { id: 'payments', label: 'المدفوعات', apiMethod: 'payments' },
  { id: 'profit-loss', label: 'الأرباح والخسائر', apiMethod: 'profitLoss' },
  { id: 'inventory', label: 'المخزون', apiMethod: 'inventory' },
];

const ROW_KEYS: Record<LegacyTab, string[]> = {
  'comprehensive-sales': ['sales', 'items', 'data'],
  'comprehensive-purchases': ['purchases', 'items', 'data'],
  products: ['products', 'data', 'rows'],
  customers: ['customers', 'data'],
  suppliers: ['suppliers', 'data'],
  employees: ['employees', 'data'],
  payments: ['payments', 'data'],
  'profit-loss': ['lines', 'items', 'data'],
  inventory: ['products', 'items', 'data'],
};

function legacyDefinition(tab: LegacyTab): ReportDefinition {
  const metrics: ReportDefinition['metrics'] =
    tab === 'comprehensive-sales'
      ? [
          { key: 'total_sales', label: 'إجمالي المبيعات', format: 'money', tone: 'primary' },
          { key: 'total_paid', label: 'المدفوع', format: 'money', tone: 'success' },
          { key: 'total_transactions', label: 'عدد العمليات', format: 'number', tone: 'info' },
        ]
      : tab === 'inventory'
        ? [
            { key: 'total_inventory_value', label: 'قيمة المخزون', format: 'money', tone: 'primary' },
            { key: 'low_stock_count', label: 'منخفض المخزون', format: 'number', tone: 'warning' },
          ]
        : tab === 'profit-loss'
          ? [
              { key: 'total_revenue', label: 'الإيرادات', format: 'money', tone: 'success' },
              { key: 'total_expenses', label: 'المصروفات', format: 'money', tone: 'danger' },
              { key: 'net_profit', label: 'صافي الربح', format: 'money', tone: 'primary' },
            ]
          : [{ key: 'total', label: 'الإجمالي', format: 'money', tone: 'primary' }];

  return {
    id: 'legacy-comprehensive',
    title: TABS.find((t) => t.id === tab)?.label ?? 'كلاسيكي',
    description: 'تقرير كلاسيكي من الويب',
    group: 'other',
    icon: 'assessment',
    webRoute: '/reports/legacy',
    permission: 'view_reports',
    apiMethod: TABS.find((t) => t.id === tab)?.apiMethod ?? 'comprehensiveSales',
    filters: ['dateRange', 'branch', 'customer', 'supplier', 'cashier', 'status', 'paymentMethod', 'perPage'],
    paginated: tab === 'products' || tab === 'customers',
    metrics,
    sections: [
      {
        id: 'rows',
        title: 'البيانات',
        extractRows: (p) => reportRows(p, ROW_KEYS[tab]),
        fields: [
          { key: 'name', label: 'الاسم', format: 'text', primary: true },
          { key: 'total', label: 'المبلغ', format: 'money' },
          { key: 'amount', label: 'قيمة', format: 'money' },
          { key: 'status', label: 'الحالة', format: 'badge' },
          { key: 'payment_type', label: 'الدفع', format: 'text' },
          { key: 'created_at', label: 'التاريخ', format: 'date' },
        ],
      },
    ],
  };
}

export function LegacyReportsScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const c = useColors();
  const [tab, setTab] = useState<LegacyTab>('comprehensive-sales');
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const viewMode = useBranchStore((s) => s.viewMode);
  const [filters, setFilters] = useState(() => {
    const f = defaultReportFilters();
    if (viewMode === 'branch' && activeBranch?.id) f.branch_id = activeBranch.id;
    return f;
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const definition = useMemo(() => legacyDefinition(tab), [tab]);
  const { payload, metrics, loading, refreshing, error, refresh, loadMore, hasMore, loadingMore } = useReport(definition, filters);

  const resolvedMetrics = useMemo(() => reportSummary(payload) as Record<string, unknown>, [payload]);
  const section = definition.sections[0];
  const rows = section?.extractRows(payload) ?? [];

  const subtitle = `${filters.from_date} — ${filters.to_date}`;

  const headerRight = (
    <Pressable onPress={() => setFilterOpen(true)} accessibilityLabel="فلاتر">
      <MaterialIcons name="filter-list" size={24} color={c.text} />
    </Pressable>
  );

  return (
    <AppScreen
      title="التقارير الكلاسيكية"
      subtitle={subtitle}
      onBack={navigation.goBack}
      headerRight={headerRight}
      refreshing={refreshing}
      onRefresh={() => void refresh()}
    >
      <ScrollChips tab={tab} onChange={setTab} />
      {loading && !payload ? <AppLoadingState /> : null}
      {error && !payload ? <AppErrorState message={error} onRetry={() => void refresh()} /> : null}
      {payload ? (
        <>
          <ReportFilterChips definition={definition} filters={filters} />
          <ReportSummaryCards definition={definition} metrics={{ ...metrics, ...resolvedMetrics }} />
          {rows.length && section ? <ReportListCards section={section} rows={rows} /> : (
            <AppEmptyState title="لا توجد بيانات لهذا التقرير في الفترة المحددة." />
          )}
          {hasMore ? (
            <AppButton title={loadingMore ? 'جاري التحميل...' : 'تحميل المزيد'} variant="secondary" disabled={loadingMore} onPress={() => void loadMore()} />
          ) : null}
        </>
      ) : null}
      <ReportFilterSheet
        visible={filterOpen}
        definition={definition}
        filters={filters}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
      />
    </AppScreen>
  );
}

function ScrollChips({ tab, onChange }: { tab: LegacyTab; onChange: (t: LegacyTab) => void }) {
  return (
    <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
      {TABS.map((t) => (
        <AppChip key={t.id} label={t.label} active={tab === t.id} onPress={() => onChange(t.id)} />
      ))}
    </View>
  );
}
