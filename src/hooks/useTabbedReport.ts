import { useCallback, useEffect, useRef, useState } from 'react';
import { useBranchStore } from '@/store/branchStore';
import { normalizeApiError } from '@/utils/errors';
import type { TabbedReportData } from '@/utils/inventoryReportNormalizers';

export type TabbedReportFilters = {
  branch_id: string;
  warehouse_id: string;
  from_date: string;
  to_date: string;
  include_comparison: boolean;
  comparison_mode: string;
  compare_from_date: string;
  compare_to_date: string;
};

export type TabbedFetchParams = {
  tab: string;
  branch_id?: string;
  warehouse_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  per_page?: number;
  include_aggregates?: boolean;
  include_comparison?: boolean;
  comparison_mode?: string;
  compare_from_date?: string;
  compare_to_date?: string;
};

const PER_PAGE = 20;

export function defaultTabbedFilters(): TabbedReportFilters {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    branch_id: '',
    warehouse_id: '',
    from_date: fmt(from),
    to_date: fmt(to),
    include_comparison: false,
    comparison_mode: 'previous_period',
    compare_from_date: '',
    compare_to_date: '',
  };
}

type Options<TTab extends string> = {
  tab: TTab;
  tabsNeedingDates: TTab[];
  tabsWithComparison?: TTab[];
  fetch: (params: TabbedFetchParams) => Promise<unknown>;
  normalize: (payload: unknown, previous?: TabbedReportData | null) => TabbedReportData;
};

export function useTabbedReport<TTab extends string>({
  tab,
  tabsNeedingDates,
  tabsWithComparison = [],
  fetch,
  normalize,
}: Options<TTab>) {
  const viewMode = useBranchStore((s) => s.viewMode);
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const [filters, setFilters] = useState<TabbedReportFilters>(() => defaultTabbedFilters());
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [data, setData] = useState<TabbedReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const skipTablePageEffect = useRef(false);
  const fetchRef = useRef(fetch);
  const normalizeRef = useRef(normalize);

  fetchRef.current = fetch;
  normalizeRef.current = normalize;

  useEffect(() => {
    if (viewMode === 'branch' && activeBranch?.id) {
      setFilters((f) => (f.branch_id === activeBranch.id ? f : { ...f, branch_id: activeBranch.id }));
    }
  }, [viewMode, activeBranch?.id]);

  const needsDates = tabsNeedingDates.includes(tab);
  const supportsComparison = tabsWithComparison.includes(tab);

  const filtersKey = [
    tab,
    filters.branch_id,
    filters.warehouse_id,
    filters.from_date,
    filters.to_date,
    filters.include_comparison,
    filters.comparison_mode,
    filters.compare_from_date,
    filters.compare_to_date,
  ].join('|');

  const buildParams = useCallback(
    (targetPage: number, includeAggregates: boolean): TabbedFetchParams => {
      const params: TabbedFetchParams = {
        tab,
        branch_id: filters.branch_id || undefined,
        warehouse_id: filters.warehouse_id || undefined,
        page: targetPage,
        per_page: PER_PAGE,
        include_aggregates: includeAggregates,
      };
      if (needsDates) {
        params.from_date = filters.from_date;
        params.to_date = filters.to_date;
      }
      if (supportsComparison && filters.include_comparison) {
        params.include_comparison = true;
        params.comparison_mode = filters.comparison_mode || undefined;
        if (filters.compare_from_date) params.compare_from_date = filters.compare_from_date;
        if (filters.compare_to_date) params.compare_to_date = filters.compare_to_date;
      }
      return params;
    },
    [tab, filters, needsDates, supportsComparison],
  );

  const loadFull = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRef.current(buildParams(1, true));
      setData(normalizeRef.current(res));
    } catch (err) {
      setError(normalizeApiError(err).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const loadTablePage = useCallback(
    async (targetPage: number) => {
      setTableLoading(true);
      try {
        const res = await fetchRef.current(buildParams(targetPage, false));
        setData((prev) => normalizeRef.current(res, prev));
      } catch (err) {
        setError(normalizeApiError(err).message);
      } finally {
        setTableLoading(false);
      }
    },
    [buildParams],
  );

  const loadFullRef = useRef(loadFull);
  loadFullRef.current = loadFull;

  useEffect(() => {
    skipTablePageEffect.current = true;
    setPage(1);
    void loadFullRef.current();
  }, [filtersKey]);

  useEffect(() => {
    if (skipTablePageEffect.current) {
      skipTablePageEffect.current = false;
      return;
    }
    if (page <= 1) return;
    void loadTablePage(page);
  }, [page, loadTablePage]);

  const refresh = useCallback(() => loadFull(), [loadFull]);

  return {
    filters,
    setFilters,
    page,
    setPage,
    loading,
    tableLoading,
    data,
    error,
    refresh,
    perPage: PER_PAGE,
    needsDates,
    supportsComparison,
  };
}
