import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ApiEnvelope, ListParams, PaginationMeta } from '@/types/api';
import { extractArray, extractPagination } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';

type Loader<T> = (params: ListParams) => Promise<ApiEnvelope<T[]>>;

export function useListResource<T>(loader: Loader<T>, baseParams: ListParams = {}) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stableParams = useMemo(() => JSON.stringify(baseParams), [baseParams]);

  const load = useCallback(async (nextPage = 1, mode: 'replace' | 'append' = 'replace') => {
    if (mode === 'replace' && nextPage === 1) setLoading(true);
    if (mode === 'replace' && nextPage === 1) setRefreshing(true);
    setError(null);
    try {
      const params = { ...JSON.parse(stableParams), page: nextPage, per_page: JSON.parse(stableParams).per_page ?? 20 };
      const response = await loader(params);
      const rows = extractArray<T>(response);
      const meta = extractPagination(response);
      setPagination(meta);
      setItems((current) => mode === 'append' ? [...current, ...rows] : rows);
      setPage(nextPage);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loader, stableParams]);

  useEffect(() => {
    void load(1, 'replace');
  }, [load]);

  const refresh = useCallback(() => load(1, 'replace'), [load]);
  const loadMore = useCallback(() => {
    if (loading) return;
    if (pagination?.last_page && page >= pagination.last_page) return;
    void load(page + 1, 'append');
  }, [load, loading, page, pagination?.last_page]);

  return { items, loading, refreshing, error, pagination, refresh, loadMore };
}
