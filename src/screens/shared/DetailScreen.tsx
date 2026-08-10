import React from 'react';
import type { ApiEnvelope } from '@/types/api';
import { DetailScreenLayout } from '@/components/layout/DetailScreenLayout';
import { asText } from '@/utils/format';

type Field<T> = {
  label: string;
  value: (item: T) => string | number | null | undefined;
  ltr?: boolean;
};

type Props<T extends Record<string, unknown>> = {
  title: string;
  loader: () => Promise<ApiEnvelope<T>>;
  fields: Field<T>[];
  onBack?: () => void;
  headerRight?: React.ReactNode;
  badge?: (item: T) => { label: string; tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' } | undefined;
  children?: (item: T, actions: { refresh: () => void }) => React.ReactNode;
  embedded?: boolean;
};

export function DetailScreen<T extends Record<string, unknown>>({ title, loader, fields, onBack, headerRight, badge, children, embedded }: Props<T>) {
  return (
    <DetailScreenLayout
      title={title}
      onBack={onBack}
      headerRight={headerRight}
      loader={loader}
      badge={badge}
      heroTitle={(item) => asText(item.name ?? item.invoice_number ?? item.id)}
      fields={fields}
      embedded={embedded}
    >
      {(item, actions) => children?.(item, actions) ?? null}
    </DetailScreenLayout>
  );
}
