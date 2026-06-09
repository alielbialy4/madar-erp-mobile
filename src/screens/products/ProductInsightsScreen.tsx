import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { productsAPI } from '@/api/products';
import { AppScreen } from '@/components/layout';
import { AppErrorState } from '@/components/feedback';
import { parseProductInsightsResponse } from '@/components/products/parseProductInsights';
import { ProductInsightsHero } from '@/components/products/ProductInsightsHero';
import { ProductInsightsKpiGrid } from '@/components/products/ProductInsightsKpiGrid';
import { ProductInsightsMetaCard } from '@/components/products/ProductInsightsMetaCard';
import { ProductInsightsStatSection } from '@/components/products/ProductInsightsStatSection';
import { ProductInsightsAggregateList } from '@/components/products/ProductInsightsAggregateList';
import { ProductInsightsStockTable } from '@/components/products/ProductInsightsStockTable';
import { ProductInsightsMovementsTable } from '@/components/products/ProductInsightsMovementsTable';
import { ProductInsightsCharts } from '@/components/products/ProductInsightsCharts';
import { ProductInsightsRangeCard } from '@/components/products/ProductInsightsRangeCard';
import { ProductInsightsSkeleton } from '@/components/products/ProductInsightsSkeleton';
import { ProductInsightsSectionGroup } from '@/components/products/ProductInsightsSectionGroup';
import {
  buildRangePreset,
  createPlaceholderProduct,
} from '@/components/products/productInsightsUtils';
import { normalizeApiError } from '@/utils/errors';
import type { ProductsStackParamList } from '@/types/navigation';
import type { ProductInsightsPayload, ViewMode } from '@/types/productInsights';
import { useBranchStore } from '@/store/branchStore';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductInsights'>;
type Route = RouteProp<ProductsStackParamList, 'ProductInsights'>;

const DEFAULT_RANGE_DAYS = 30;

export function ProductInsightsScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const activeBranch = useBranchStore((s) => s.activeBranch);

  const id = route.params.id;
  const [range, setRange] = useState(() => buildRangePreset(DEFAULT_RANGE_DAYS));
  const [movementsPage, setMovementsPage] = useState(1);
  const [payload, setPayload] = useState<ProductInsightsPayload | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('branch');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (opts.silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await productsAPI.getInsights(id, {
          from: range.from,
          to: range.to,
          movements_page: movementsPage,
          movements_per_page: 15,
        });
        const parsed = parseProductInsightsResponse(res);
        setPayload(parsed.payload);
        setViewMode(parsed.viewMode);
        setLastUpdatedAt(new Date());
      } catch (err) {
        setError(normalizeApiError(err).message);
        if (!opts.silent) setPayload(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, range.from, range.to, movementsPage],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const onRangeChange = useCallback((key: 'from' | 'to', value: string) => {
    setMovementsPage(1);
    setRange((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onPresetSelect = useCallback((days: number) => {
    setMovementsPage(1);
    setRange(buildRangePreset(days));
  }, []);

  const handleMovementsPage = useCallback((page: number) => {
    setMovementsPage(page);
  }, []);

  const showBranchColumns = viewMode === 'global';
  const isInitialLoad = loading && !payload;
  const isStaleRefresh = (loading || refreshing) && Boolean(payload);

  const heroProduct = payload?.product ?? createPlaceholderProduct(
    String(route.params.name ?? 'تحليلات المنتج'),
    typeof id === 'number' ? id : Number(id) || 0,
  );

  const screenTitle = payload?.product.name ?? route.params.name ?? 'تحليلات المنتج';

  return (
    <AppScreen
      title={screenTitle}
      onBack={navigation.goBack}
      scroll
      onRefresh={() => void load({ silent: true })}
      refreshing={refreshing}
    >
      <View style={[styles.content, isTablet && styles.contentTablet]}>
        <ProductInsightsHero
          product={heroProduct}
          viewMode={viewMode}
          branchName={activeBranch?.name}
          totalQuantity={payload?.inventory.total_quantity}
          onRefresh={() => void load({ silent: true })}
          isLoading={refreshing}
          loading={isInitialLoad}
          lastUpdatedAt={lastUpdatedAt}
          edgeInset={false}
        />

        <ProductInsightsRangeCard
          range={range}
          appliedRange={payload?.range ?? null}
          onRangeChange={onRangeChange}
          onPresetSelect={onPresetSelect}
        />

        {isInitialLoad ? <ProductInsightsSkeleton /> : null}
        {error && !payload ? <AppErrorState message={error} onRetry={() => void load()} /> : null}

        {payload ? (
          <View
            style={[styles.dataWrap, isStaleRefresh && styles.dataStale]}
            pointerEvents={isStaleRefresh ? 'none' : 'auto'}
          >
            <ProductInsightsKpiGrid payload={payload} />
            <ProductInsightsMetaCard product={payload.product} />

            {payload.sales.top_branch ? (
              <ProductInsightsAggregateList variant="top_branch" row={payload.sales.top_branch} />
            ) : null}

            <ProductInsightsSectionGroup
              title="المخزون"
              subtitle="كميات حالية في كل فرع ومخزن — ليست محصورة بالفترة"
              columns={2}
            >
              <ProductInsightsStockTable variant="branch" rows={payload.inventory.branches} />
              <ProductInsightsStockTable
                variant="warehouse"
                rows={payload.inventory.warehouses}
                showBranchColumn={showBranchColumns}
              />
            </ProductInsightsSectionGroup>

            <ProductInsightsSectionGroup
              title="الأداء"
              subtitle="ملخص المبيعات والمشتريات والمرتجعات ضمن الفترة المحددة"
            >
              <ProductInsightsSectionGroup columns={2}>
                <ProductInsightsStatSection variant="sales" sales={payload.sales} />
                <ProductInsightsStatSection variant="returns" returns={payload.returns} />
              </ProductInsightsSectionGroup>

              {showBranchColumns && payload.sales.by_branch.length > 0 ? (
                <ProductInsightsAggregateList
                  variant="by_branch"
                  title="المبيعات حسب الفرع"
                  rows={payload.sales.by_branch}
                />
              ) : null}

              <ProductInsightsStatSection variant="purchases" purchases={payload.purchases} />

              {payload.purchases.top_suppliers.length > 0 ? (
                <ProductInsightsAggregateList variant="top_suppliers" rows={payload.purchases.top_suppliers} />
              ) : null}

              {showBranchColumns && payload.purchases.by_branch.length > 0 ? (
                <ProductInsightsAggregateList
                  variant="by_branch"
                  title="المشتريات حسب الفرع"
                  rows={payload.purchases.by_branch}
                />
              ) : null}
            </ProductInsightsSectionGroup>

            <ProductInsightsSectionGroup
              title="النشاط"
              subtitle="حركات المخزون والرسوم البيانية اليومية"
            >
              <ProductInsightsMovementsTable
                movements={payload.movements}
                showBranchColumn={showBranchColumns}
                onPageChange={handleMovementsPage}
                loading={isStaleRefresh}
              />
              <ProductInsightsCharts payload={payload} />
            </ProductInsightsSectionGroup>
          </View>
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  contentTablet: {
    gap: spacing.xl,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  dataWrap: {
    gap: spacing.lg,
  },
  dataStale: {
    opacity: 0.6,
  },
});
