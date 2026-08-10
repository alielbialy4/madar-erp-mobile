import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { tu } from '@/i18n/tu';

/** Reactive wrapper around `tu` — re-renders when language changes. */
export function useTu() {
  const { i18n } = useTranslation();
  return useCallback(
    (input: string, options?: Record<string, unknown>) => {
      void i18n.language;
      return tu(input, options);
    },
    [i18n.language],
  );
}
