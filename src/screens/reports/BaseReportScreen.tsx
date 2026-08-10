import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppScreen, ReportScreenLayout } from '@/components/layout';
import { AppButton } from '@/components/ui';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { defaultReportFilters, useReport } from '@/hooks/useReport';
import { usePermissions } from '@/hooks/usePermissions';
import { getReportDefinition } from '@/reports/reportDefinitions';
import type { ReportDefinition, ReportId } from '@/reports/types';
import { useBranchStore } from '@/store/branchStore';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { flexRow } from '@/constants/layout';
import { ReportFilterSheet } from './ReportFilterSheet';
import { ReportSummaryCards } from './ReportSummaryCards';
import { ReportListCards } from './ReportListCards';
import { ReportFilterChips } from './ReportFilterChips';
import { ReportExportActions } from './ReportExportActions';
import { ReportBarChart } from './ReportBarChart';

type Props = {
  reportId: ReportId;
  initialFilters?: Record<string, string | number | boolean | undefined>;
  navigation: { goBack: () => void };
};

export function BaseReportScreen({ reportId, initialFilters, navigation }: Props) {
  const definition = getReportDefinition(reportId);
  if (!definition) {
    return (
      <AppScreen title="تقرير غير موجود" onBack={navigation.goBack}>
        <AppEmptyState title="التقرير غير معرّف في التطبيق" />
      </AppScreen>
    );
  }
  return <BaseReportScreenContent definition={definition} initialFilters={initialFilters} navigation={navigation} />;
}

function BaseReportScreenContent({
  definition,
  initialFilters: routeFilters,
  navigation,
}: {
  definition: ReportDefinition;
  initialFilters?: Record<string, string | number | boolean | undefined>;
  navigation: { goBack: () => void };
}) {
  const c = useColors();
  const { can, hasFeature } = usePermissions();
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const viewMode = useBranchStore((s) => s.viewMode);

  const initialReportFilters = useMemo(() => {
    const f = defaultReportFilters();
    if (viewMode === 'branch' && activeBranch?.id) f.branch_id = activeBranch.id;
    return { ...f, ...(routeFilters ?? {}) };
  }, [activeBranch?.id, viewMode, routeFilters]);

  const [filters, setFilters] = useState(initialReportFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  const allowed = can(definition.permission) && (!definition.feature || hasFeature(definition.feature));

  const { payload, metrics, loading, loadingMore, error, refresh, loadMore, hasMore } = useReport(
    definition,
    filters,
  );

  const headerRight = (
    <View style={{ ...flexRow, gap: spacing.sm }}>
      <Pressable onPress={() => setFilterOpen(true)} accessibilityLabel="فلاتر">
        <MaterialIcons name="filter-list" size={24} color={c.text} />
      </Pressable>
      <Pressable onPress={() => void refresh()} accessibilityLabel="تحديث">
        <MaterialIcons name="refresh" size={24} color={c.accent} />
      </Pressable>
    </View>
  );

  const subtitle = definition.filters.includes('dateRange')
    ? `من ${filters.from_date} إلى ${filters.to_date}`
    : definition.description;

  const sectionsContent = useMemo(() => {
    if (!payload) return [];
    return definition.sections.map((section) => ({
      section,
      rows: section.extractRows(payload),
    }));
  }, [definition.sections, payload]);

  const hasRows = sectionsContent.some((s) => s.rows.length > 0);

  if (!allowed) {
    return (
      <AppScreen title={definition.title} onBack={navigation.goBack}>
        <AppErrorState message="ليس لديك صلاحية لعرض هذا التقرير." />
      </AppScreen>
    );
  }

  return (
    <ReportScreenLayout
      title={definition.title}
      subtitle={subtitle}
      onBack={navigation.goBack}
      headerRight={headerRight}
      filters={<ReportFilterChips definition={definition} filters={filters} />}
      exportActions={<ReportExportActions definition={definition} filters={filters} />}
    >
      {loading && !payload ? <AppLoadingState /> : null}
      {error && !payload ? <AppErrorState message={error} onRetry={() => void refresh()} /> : null}
      {payload ? (
        <>
          <ReportSummaryCards definition={definition} metrics={metrics} />
          {definition.chart && payload
            ? (() => {
                const chartSection = sectionsContent.find((s) => s.section.id === definition.chart!.sectionId);
                if (!chartSection?.rows.length) return null;
                return (
                  <ReportBarChart
                    title="مخطط ملخص"
                    rows={chartSection.rows}
                    labelKey={definition.chart.labelKey}
                    valueKey={definition.chart.valueKey}
                    valueFormat={definition.chart.valueFormat}
                  />
                );
              })()
            : null}
          {sectionsContent.map(({ section, rows }) =>
            rows.length ? <ReportListCards key={section.id} section={section} rows={rows} /> : null,
          )}
          {!hasRows ? <AppEmptyState title="لا توجد بيانات لهذا التقرير في الفترة المحددة." /> : null}
          {hasMore ? (
            <AppButton
              title={loadingMore ? 'جاري التحميل...' : 'تحميل المزيد'}
              variant="secondary"
              disabled={loadingMore}
              onPress={() => void loadMore()}
            />
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
    </ReportScreenLayout>
  );
}
