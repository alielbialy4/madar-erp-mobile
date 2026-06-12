import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppDateRangePicker, AppSelect } from '@/components/ui';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { useBranchStore } from '@/store/branchStore';
import { useReportFilterOptions } from '@/hooks/useReportFilterOptions';
import type { TabbedReportFilters } from '@/hooks/useTabbedReport';
import type { TabbedReportData } from '@/utils/inventoryReportNormalizers';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { ReportTabBar } from './ReportTabBar';
import { ReportKpiRow, type KpiItem } from './ReportKpiRow';
import { ReportBreakdownSection } from './ReportBreakdownSection';
import { ReportTableSection, type ReportColumnDef } from './ReportTableSection';

type Tab = { id: string; label: string };

type BreakdownConfig = {
  title: string;
  description?: string;
  dataKey: keyof TabbedReportData;
  labelKey: string;
  valueKey: string;
  valueFormat?: 'money' | 'number' | 'text';
};

type Props = {
  title: string;
  subtitle: string;
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  filters: TabbedReportFilters;
  onFiltersChange: (filters: TabbedReportFilters) => void;
  needsDates: boolean;
  supportsComparison?: boolean;
  loading: boolean;
  tableLoading: boolean;
  error: string | null;
  data: TabbedReportData | null;
  onRefresh: () => void;
  kpis: KpiItem[];
  breakdowns?: BreakdownConfig[];
  columns: ReportColumnDef[];
  emptyMessage: string;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onBack: () => void;
  extraBadges?: React.ReactNode;
};

export function TabbedReportScreen({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  filters,
  onFiltersChange,
  needsDates,
  supportsComparison,
  loading,
  tableLoading,
  error,
  data,
  onRefresh,
  kpis,
  breakdowns = [],
  columns,
  emptyMessage,
  page,
  perPage,
  onPageChange,
  onBack,
  extraBadges,
}: Props) {
  const c = useColors();
  const [filterOpen, setFilterOpen] = useState(false);
  const viewMode = useBranchStore((s) => s.viewMode);
  const branches = useBranchStore((s) => s.branches);
  const loadBranches = useBranchStore((s) => s.loadBranches);
  const isGlobalView = viewMode === 'global';
  const { warehouses } = useReportFilterOptions(['warehouse']);

  useEffect(() => {
    if (isGlobalView && branches.length === 0) void loadBranches();
  }, [isGlobalView, branches.length, loadBranches]);

  const branchOptions = useMemo(
    () => [{ label: 'كل الفروع', value: '' }, ...branches.map((b) => ({ label: b.name, value: String(b.id) }))],
    [branches],
  );

  const warehouseOptions = useMemo(
    () => [{ label: 'كل المستودعات', value: '' }, ...warehouses.map((w) => ({ label: w.label, value: w.id }))],
    [warehouses],
  );

  const headerRight = (
    <View style={{ ...flexRow, gap: spacing.sm }}>
      <Pressable onPress={() => setFilterOpen(true)} accessibilityLabel="فلاتر">
        <MaterialIcons name="filter-list" size={24} color={c.text} />
      </Pressable>
      <Pressable onPress={() => void onRefresh()} accessibilityLabel="تحديث">
        <MaterialIcons name="refresh" size={24} color={c.accent} />
      </Pressable>
    </View>
  );

  const summary = data?.summary ?? {};
  const pagination = data?.pagination ?? { total: 0, per_page: perPage, current_page: page, last_page: 1 };

  return (
    <AppScreen title={title} subtitle={subtitle} onBack={onBack} headerRight={headerRight}>
      <ReportTabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />

      {extraBadges ? <View style={{ ...flexRow, gap: spacing.sm, flexWrap: 'wrap' }}>{extraBadges}</View> : null}

      {loading && !data ? <AppLoadingState /> : null}
      {error && !data ? <AppErrorState message={error} onRetry={() => void onRefresh()} /> : null}

      {data ? (
        <View style={{ gap: spacing.lg }}>
          {kpis.length ? <ReportKpiRow items={kpis} summary={summary} /> : null}
          {breakdowns.map((bd) => (
            <ReportBreakdownSection
              key={bd.title}
              title={bd.title}
              description={bd.description}
              data={(data[bd.dataKey] as Record<string, unknown>[] | undefined) ?? []}
              labelKey={bd.labelKey}
              valueKey={bd.valueKey}
              valueFormat={bd.valueFormat}
              rows={[]}
            />
          ))}
          <ReportTableSection
            title="التفاصيل"
            description="قائمة السجلات مع ترقيم الصفحات"
            columns={columns}
            rows={data.rows}
            loading={tableLoading}
            emptyMessage={emptyMessage}
            page={page}
            perPage={perPage}
            total={pagination.total}
            onPageChange={onPageChange}
          />
        </View>
      ) : null}

      <AppBottomSheet visible={filterOpen} onClose={() => setFilterOpen(false)} title="فلاتر التقرير">
        <View style={{ gap: spacing.md }}>
          {isGlobalView ? (
            <AppSelect
              label="الفرع"
              value={filters.branch_id || null}
              options={branchOptions}
              onChange={(v) => onFiltersChange({ ...filters, branch_id: v ?? '' })}
            />
          ) : null}
          <AppSelect
            label="المستودع"
            value={filters.warehouse_id || null}
            options={warehouseOptions}
            onChange={(v) => onFiltersChange({ ...filters, warehouse_id: v ?? '' })}
          />
          {needsDates ? (
            <AppDateRangePicker
              fromDate={filters.from_date}
              toDate={filters.to_date}
              onChangeFrom={(from_date) => onFiltersChange({ ...filters, from_date })}
              onChangeTo={(to_date) => onFiltersChange({ ...filters, to_date })}
            />
          ) : null}
          {supportsComparison ? (
            <AppSelect
              label="مقارنة الفترة"
              value={filters.include_comparison ? 'yes' : 'no'}
              options={[
                { label: 'بدون مقارنة', value: 'no' },
                { label: 'مع مقارنة', value: 'yes' },
              ]}
              onChange={(v) => onFiltersChange({ ...filters, include_comparison: v === 'yes' })}
            />
          ) : null}
          <AppButton title="تطبيق" onPress={() => setFilterOpen(false)} />
        </View>
      </AppBottomSheet>
    </AppScreen>
  );
}

export function CostPolicyBadge({ policy }: { policy?: unknown }) {
  if (!policy) return null;
  return <AppBadge label={`سياسة التكلفة: ${String(policy)}`} tone="info" />;
}
