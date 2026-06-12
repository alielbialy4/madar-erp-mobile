import React, { useCallback, useMemo, useState } from 'react';
import { reportsAPI } from '@/api/reports';
import { useTabbedReport } from '@/hooks/useTabbedReport';
import { normalizeRawMaterialsReport } from '@/utils/inventoryReportNormalizers';
import { TabbedReportScreen } from './TabbedReportScreen';
import {
  RAW_MATERIALS_TABS,
  rawMaterialsColumns,
  rawMaterialsEmptyMessage,
  rawMaterialsKpis,
  type RawMaterialsTab,
} from './rawMaterialsTabColumns';

const TABS_NEEDING_DATES: RawMaterialsTab[] = ['expiry', 'purchases'];
const TABS_WITH_COMPARISON: RawMaterialsTab[] = ['purchases'];

export function RawMaterialsReportScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const [activeTab, setActiveTab] = useState<RawMaterialsTab>('stock');

  const fetchReport = useCallback(
    (params: Parameters<typeof reportsAPI.rawMaterialsReport>[0]) => reportsAPI.rawMaterialsReport(params),
    [],
  );

  const normalize = useCallback(
    (payload: unknown, previous?: ReturnType<typeof normalizeRawMaterialsReport> | null) =>
      normalizeRawMaterialsReport(payload, activeTab, previous),
    [activeTab],
  );

  const {
    filters,
    setFilters,
    page,
    setPage,
    loading,
    tableLoading,
    data,
    error,
    refresh,
    perPage,
    needsDates,
    supportsComparison,
  } = useTabbedReport({
    tab: activeTab,
    tabsNeedingDates: TABS_NEEDING_DATES,
    tabsWithComparison: TABS_WITH_COMPARISON,
    fetch: fetchReport,
    normalize,
  });

  const breakdowns = useMemo(() => {
    if (activeTab === 'purchases') {
      return [
        { title: 'حسب المورد', dataKey: 'by_supplier' as const, labelKey: 'supplier', valueKey: 'total_cost', valueFormat: 'money' as const },
        { title: 'حسب النوع', dataKey: 'by_role' as const, labelKey: 'role', valueKey: 'total_cost', valueFormat: 'money' as const },
      ];
    }
    if (activeTab === 'stock' || activeTab === 'low') {
      return [
        { title: 'حسب النوع', dataKey: 'by_role' as const, labelKey: 'role', valueKey: 'total_value', valueFormat: 'money' as const },
      ];
    }
    return [];
  }, [activeTab]);

  return (
    <TabbedReportScreen
      title="تقارير الخامات"
      subtitle="مخزون، تنبيهات، صلاحية، ومشتريات الخامات"
      tabs={RAW_MATERIALS_TABS}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as RawMaterialsTab)}
      filters={filters}
      onFiltersChange={setFilters}
      needsDates={needsDates}
      supportsComparison={supportsComparison}
      loading={loading}
      tableLoading={tableLoading}
      error={error}
      data={data}
      onRefresh={refresh}
      kpis={rawMaterialsKpis(activeTab)}
      breakdowns={breakdowns}
      columns={rawMaterialsColumns(activeTab)}
      emptyMessage={rawMaterialsEmptyMessage(activeTab)}
      page={page}
      perPage={perPage}
      onPageChange={setPage}
      onBack={navigation.goBack}
    />
  );
}
