import React, { useCallback, useMemo, useState } from 'react';
import { reportsAPI } from '@/api/reports';
import { useTabbedReport } from '@/hooks/useTabbedReport';
import { normalizeRecipesReport } from '@/utils/inventoryReportNormalizers';
import { CostPolicyBadge, TabbedReportScreen } from './tabbed/TabbedReportScreen';
import {
  RECIPES_TABS,
  RECIPES_TABS_NEEDING_DATES,
  RECIPES_TABS_WITH_COMPARISON,
  recipesColumns,
  recipesEmptyMessage,
  recipesKpis,
  type RecipesTab,
} from './tabbed/recipesTabColumns';

export function RecipeReportsScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const [activeTab, setActiveTab] = useState<RecipesTab>('consumption');

  const fetchReport = useCallback(
    (params: Parameters<typeof reportsAPI.recipesReport>[0]) => reportsAPI.recipesReport(params),
    [],
  );

  const normalize = useCallback(
    (payload: unknown, previous?: ReturnType<typeof normalizeRecipesReport> | null) =>
      normalizeRecipesReport(payload, activeTab, previous),
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
    tabsNeedingDates: RECIPES_TABS_NEEDING_DATES,
    tabsWithComparison: RECIPES_TABS_WITH_COMPARISON,
    fetch: fetchReport,
    normalize,
  });

  const breakdowns = useMemo(() => {
    if (activeTab === 'consumption' || activeTab === 'finished_goods') {
      return [
        { title: 'حسب المكوّن', dataKey: 'by_ingredient' as const, labelKey: 'ingredient', valueKey: 'consumed_qty', valueFormat: 'number' as const },
        { title: 'حسب المنتج', dataKey: 'by_product' as const, labelKey: 'product', valueKey: 'consumed_qty', valueFormat: 'number' as const },
      ];
    }
    if (activeTab === 'variance') {
      return [{ title: 'حسب المكوّن', dataKey: 'by_ingredient' as const, labelKey: 'ingredient', valueKey: 'variance_qty', valueFormat: 'number' as const }];
    }
    return [];
  }, [activeTab]);

  return (
    <TabbedReportScreen
      title="تقارير تكلفة الوصفات"
      subtitle="استهلاك الخامات، التكلفة، الوصفات الناقصة، والفرق المتوقع"
      tabs={RECIPES_TABS}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as RecipesTab)}
      filters={filters}
      onFiltersChange={setFilters}
      needsDates={needsDates}
      supportsComparison={supportsComparison}
      loading={loading}
      tableLoading={tableLoading}
      error={error}
      data={data}
      onRefresh={refresh}
      kpis={recipesKpis(activeTab)}
      breakdowns={breakdowns}
      columns={recipesColumns(activeTab)}
      emptyMessage={recipesEmptyMessage(activeTab)}
      page={page}
      perPage={perPage}
      onPageChange={setPage}
      onBack={navigation.goBack}
      extraBadges={activeTab === 'cost' ? <CostPolicyBadge policy={data?.meta.cost_policy} /> : null}
    />
  );
}
