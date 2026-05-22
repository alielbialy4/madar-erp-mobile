import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { inventoryAPI } from '@/api/inventory';
import { partnerReportsAPI } from '@/api/partnerReports';
import { callReportApi, type ReportsApiKey } from '@/api/reports';
import type { ReportDefinition, ReportFilters } from '@/reports/types';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { metricValue, normalizeMetrics, reportPagination, reportSummary } from '@/utils/reportNormalizers';

function buildQueryParams(definition: ReportDefinition, filters: ReportFilters, page: number): Record<string, string | number | boolean | undefined> {
  const params: Record<string, string | number | boolean | undefined> = {};
  if (definition.filters.includes('dateRange')) {
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
  }
  if (definition.usePartnerApi) {
    if (filters.from_date) params.start_date = filters.from_date;
    if (filters.to_date) params.end_date = filters.to_date;
  }
  if (definition.filters.includes('branch') && filters.branch_id) params.branch_id = filters.branch_id;
  if (definition.filters.includes('warehouse') && filters.warehouse_id) params.warehouse_id = filters.warehouse_id;
  if (definition.filters.includes('category') && filters.category_id) params.category_id = filters.category_id;
  if (definition.filters.includes('product') && filters.product_id) params.product_id = Number(filters.product_id);
  if (definition.filters.includes('customer') && filters.customer_id) params.customer_id = filters.customer_id;
  if (definition.filters.includes('supplier') && filters.supplier_id) params.supplier_id = filters.supplier_id;
  if (definition.filters.includes('cashier') && filters.cashier_id) {
    params.user_id = filters.cashier_id;
    params.cashier_id = filters.cashier_id;
  }
  if (definition.filters.includes('search') && filters.search) params.search = filters.search;
  if (definition.filters.includes('couponCode') && filters.coupon_code) params.coupon_code = filters.coupon_code;
  if (definition.filters.includes('status') && filters.status) params.status = filters.status;
  if (definition.filters.includes('paymentMethod') && filters.payment_method) params.payment_method = filters.payment_method;
  if (definition.filters.includes('expiryOptions')) {
    params.days_threshold = filters.days_threshold;
    if (filters.expired_only) params.expired_only = true;
    if (filters.near_expiry_only) params.near_expiry_only = true;
  }
  if (definition.paginated || definition.filters.includes('perPage')) {
    params.page = page;
    params.per_page = filters.per_page;
  }
  return params;
}

function resolveMetrics(definition: ReportDefinition, payload: unknown): Record<string, unknown> {
  const summary = normalizeMetrics(reportSummary(payload));
  if (definition.id === 'sales-dashboard') {
    const data = extractData<Record<string, unknown>>(payload as never) ?? {};
    const salesSummary = (data.sales_summary as Record<string, unknown> | undefined)?.summary as Record<string, unknown> | undefined;
    return normalizeMetrics({ ...summary, ...(salesSummary ?? {}) });
  }
  if (definition.id === 'sales-hourly') {
    const data = extractData<Record<string, unknown>>(payload as never) ?? {};
    const rows = (data.hourly ?? data.hours) as Record<string, unknown>[] | undefined;
    const list = Array.isArray(rows) ? rows : [];
    let peak = list[0];
    for (const row of list) {
      if (Number(row.revenue ?? 0) > Number(peak?.revenue ?? 0)) peak = row;
    }
    const total = list.reduce((acc, r) => acc + Number(r.revenue ?? 0), 0);
    return normalizeMetrics({
      peak_hour: peak?.hour ?? '—',
      peak_revenue: peak?.revenue ?? 0,
      total_revenue: total,
      ...summary,
    });
  }
  if (definition.id === 'inventory-valuation') {
    const data = extractData<Record<string, unknown>>(payload as never) ?? summary;
    return normalizeMetrics({ grand_total_value: data.grand_total_value ?? summary.grand_total_value, ...summary });
  }
  if (definition.id === 'sales-layaway') {
    const data = extractData<Record<string, unknown>>(payload as never) ?? {};
    const s = (data.summary as Record<string, unknown>) ?? summary;
    return normalizeMetrics({
      totalPlans: s.totalPlans ?? s.total_plans ?? 0,
      activePlans: s.activePlans ?? s.active_plans ?? 0,
      totalRemaining: s.totalRemaining ?? s.total_remaining ?? 0,
      totalAmount: s.totalAmount ?? s.total_amount ?? 0,
      totalPaid: s.totalPaid ?? s.total_paid ?? 0,
      ...s,
    });
  }
  if (definition.id === 'shifts') {
    const data = extractData<Record<string, unknown>>(payload as never) ?? {};
    const s = normalizeMetrics((data.summary as Record<string, unknown>) ?? summary);
    return {
      total_shifts: s.total_shifts ?? 0,
      total_sales_total: s.total_sales_total ?? s.total_sales ?? 0,
      avg_discrepancy: s.avg_discrepancy ?? s.average_discrepancy ?? 0,
      ...s,
    };
  }
  if (definition.id === 'partner-performance') {
    const data = extractData<Record<string, unknown>>(payload as never) ?? {};
    const s = normalizeMetrics((data.summary as Record<string, unknown>) ?? summary);
    return {
      total_sales: s.total_sales ?? 0,
      sales_count: s.sales_count ?? 0,
      net_profit: s.net_profit ?? 0,
      profit_margin: s.profit_margin ?? 0,
      ...s,
    };
  }
  if (definition.id === 'customers-aging') {
    return normalizeMetrics({
      total_debt: summary.total_debt ?? summary.total ?? 0,
      total_customers: summary.total_customers ?? summary.customer_count ?? 0,
      days_90_plus: summary.days_90_plus ?? summary.bucket_90_plus ?? 0,
      ...summary,
    });
  }
  return summary;
}

export function useReport(definition: ReportDefinition, filters: ReportFilters) {
  const [payload, setPayload] = useState<unknown>(null);
  const [metrics, setMetrics] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  const load = useCallback(
    async (nextPage = 1, mode: 'replace' | 'append' = 'replace') => {
      const isFirst = nextPage === 1;
      if (isFirst && mode === 'replace') {
        setLoading(true);
        setRefreshing(true);
      } else if (mode === 'append') {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const params = buildQueryParams(definition, filters, nextPage);
        let response: unknown;
        if (definition.useInventoryExpiry) {
          response = await inventoryAPI.expiryStock(params);
        } else if (definition.usePartnerApi) {
          response = await partnerReportsAPI.getPerformance({
            start_date: params.start_date as string | undefined,
            end_date: params.end_date as string | undefined,
            branch_ids: params.branch_id as string | undefined,
          });
        } else {
          response = await callReportApi(definition.apiMethod as ReportsApiKey, params);
        }
        const resolved = resolveMetrics(definition, response);
        setMetrics(resolved);
        if (mode === 'append' && definition.paginated) {
          setPayload((prev: unknown) => mergePaginatedPayload(prev, response));
        } else {
          setPayload(response);
        }
        const pagination = reportPagination(response);
        const lastPage = pagination?.last_page ?? 1;
        setHasMore(definition.paginated ? nextPage < lastPage : false);
        pageRef.current = nextPage;
        setPage(nextPage);
      } catch (err) {
        setError(normalizeApiError(err).message);
        if (mode === 'replace') setPayload(null);
      } finally {
        if (isFirst && mode === 'replace') {
          setLoading(false);
          setRefreshing(false);
        }
        if (mode === 'append') setLoadingMore(false);
      }
    },
    [definition, filters, filterKey],
  );

  useEffect(() => {
    pageRef.current = 1;
    void load(1, 'replace');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition.id, definition.apiMethod, filterKey]);

  const refresh = useCallback(() => {
    pageRef.current = 1;
    return load(1, 'replace');
  }, [load]);

  const loadMore = useCallback(() => {
    if (!definition.paginated || loadingMore || loading || !hasMore) return;
    void load(pageRef.current + 1, 'append');
  }, [definition.paginated, hasMore, load, loading, loadingMore]);

  const metric = useCallback(
    (key: string) => metricValue(metrics, key),
    [metrics],
  );

  return {
    payload,
    metrics,
    metric,
    loading,
    refreshing,
    loadingMore,
    error,
    refresh,
    loadMore,
    hasMore,
    page,
  };
}

function mergePaginatedPayload(prev: unknown, next: unknown): unknown {
  if (!prev) return next;
  const prevData = extractData<Record<string, unknown>>(prev as never) ?? (prev as Record<string, unknown>);
  const nextData = extractData<Record<string, unknown>>(next as never) ?? (next as Record<string, unknown>);
  const keys = ['usages', 'data', 'rows', 'products', 'items', 'batches'];
  for (const key of keys) {
    const a = prevData[key];
    const b = nextData[key];
    if (Array.isArray(a) && Array.isArray(b)) {
      const merged = { ...prevData, ...nextData, [key]: [...a, ...b] };
      const envelope = prev as { data?: unknown; status?: string };
      if (envelope && 'data' in envelope) return { ...envelope, data: merged };
      return merged;
    }
  }
  return next;
}

export function defaultReportFilters(): ReportFilters {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    from_date: fmt(from),
    to_date: fmt(to),
    branch_id: '',
    warehouse_id: '',
    category_id: '',
    product_id: '',
    customer_id: '',
    supplier_id: '',
    cashier_id: '',
    search: '',
    coupon_code: '',
    status: '',
    payment_method: '',
    page: 1,
    per_page: 50,
    days_threshold: 30,
    expired_only: false,
    near_expiry_only: false,
  };
}
