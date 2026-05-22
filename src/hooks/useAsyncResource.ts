import { useCallback, useEffect, useState } from 'react';
import type { ApiEnvelope } from '@/types/api';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';

export function useAsyncResource<T>(loader: () => Promise<ApiEnvelope<T>>) {
  const [data, setData] = useState<T | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await loader();
      setData(extractData<T>(response));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loader]);

  useEffect(() => {
    void load(false);
  }, [load]);

  return { data, loading, refreshing, error, reload: () => load(false), refresh: () => load(true) };
}
