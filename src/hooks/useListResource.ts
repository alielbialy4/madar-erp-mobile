import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApiEnvelope, ListParams, PaginationMeta } from '@/types/api';
import { extractArray, extractPagination, mergeListRowsById } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';

type Loader<T> = (params: ListParams) => Promise<ApiEnvelope<T[]>>;

export function useListResource<T>(loader: Loader<T>, baseParams: ListParams = {}) {
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);

  const stableParams = useMemo(() => JSON.stringify(baseParams), [baseParams]);

  const load = useCallback(
    async (nextPage = 1, mode: 'replace' | 'append' = 'replace') => {
      const isFirstPage = nextPage === 1;
      if (mode === 'replace' && isFirstPage) {
        setLoading(true);
        setRefreshing(true);
      }
      if (mode === 'append') setLoadingMore(true);
      setError(null);
      try {
        const parsed = JSON.parse(stableParams) as ListParams;
        const params = { ...parsed, page: nextPage, per_page: parsed.per_page ?? 20 };
        const response = await loader(params);
        const rows = extractArray<T>(response);
        const meta = extractPagination(response);
        setPagination(meta);
        setItems((current) => (mode === 'append' ? mergeListRowsById(current, rows) : mergeListRowsById([], rows)));
        pageRef.current = nextPage;
      } catch (err) {
        setError(normalizeApiError(err).message);
      } finally {
        if (mode === 'replace' && isFirstPage) {
          setLoading(false);
          setRefreshing(false);
        }
        if (mode === 'append') setLoadingMore(false);
      }
    },
    [loader, stableParams],
  );

  useEffect(() => {
    pageRef.current = 1;
    void load(1, 'replace');
  }, [load]);

  const refresh = useCallback(() => {
    pageRef.current = 1;
    return load(1, 'replace');
  }, [load]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore) return;
    const currentPage = pageRef.current;
    if (pagination?.last_page && currentPage >= pagination.last_page) return;
    void load(currentPage + 1, 'append');
  }, [load, loading, loadingMore, pagination?.last_page]);

  return { items, loading, refreshing, loadingMore, error, pagination, refresh, loadMore };
}
