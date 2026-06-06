import React, { useMemo, useState } from 'react';
import type { ApiEnvelope, ListParams } from '@/types/api';
import { ListScreenLayout } from '@/components/layout/ListScreenLayout';
import { AppResourceRow } from '@/components/ui/AppResourceRow';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { moduleIcons, type ModuleIconKey } from '@/constants/iconMap';

type Props<T extends Record<string, unknown>> = {
  title: string;
  subtitle?: string;
  loader: (params: ListParams) => Promise<ApiEnvelope<T[]>>;
  searchParam?: 'search' | 'q';
  onItemPress?: (item: T) => void;
  itemTitle: (item: T) => string;
  itemSubtitle?: (item: T) => string | undefined;
  itemMeta?: (item: T) => string | undefined;
  itemBadge?: (item: T) => { label: string; tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' } | undefined;
  emptyTitle?: string;
  params?: ListParams;
  headerRight?: React.ReactNode;
  noHeader?: boolean;
  moduleIcon?: ModuleIconKey;
  heroStats?: Array<{ label: string; value: string | number }>;
  fab?: { onPress: () => void; label?: string };
};

/** Thin ListScreenLayout adapter for simple CRUD lists — prefer ListScreenLayout directly in new screens */
export function CrudListScreen<T extends Record<string, unknown>>({
  title,
  subtitle,
  loader,
  searchParam = 'search',
  onItemPress,
  itemTitle,
  itemSubtitle,
  itemMeta,
  itemBadge,
  emptyTitle,
  params,
  headerRight,
  noHeader,
  moduleIcon,
  heroStats,
  fab,
}: Props<T>) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const listParams = useMemo(() => ({ ...(params ?? {}), ...(debounced ? { [searchParam]: debounced } : {}) }), [debounced, params, searchParam]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<T>(loader, listParams);

  return (
    <ListScreenLayout
      title={title}
      subtitle={subtitle}
      noHeader={noHeader}
      headerRight={headerRight}
      searchValue={query}
      onSearchChange={setQuery}
      onRefresh={refresh}
      refreshing={refreshing}
      fab={fab}
      hero={{
        eyebrow: subtitle,
        title,
        stats: heroStats,
        compact: true,
      }}
    >
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle={emptyTitle}
        keyExtractor={(item, index) => {
          const id = item.id;
          return id != null && id !== '' ? `row-${String(id)}-${index}` : `row-idx-${index}`;
        }}
        renderItem={({ item }) => {
          const badge = itemBadge?.(item);
          return (
            <AppResourceRow
              title={itemTitle(item)}
              subtitle={itemSubtitle?.(item)}
              meta={itemMeta?.(item)}
              badgeLabel={badge?.label}
              badgeTone={badge?.tone}
              leadingIcon={moduleIcon ? moduleIcons[moduleIcon] : undefined}
              onPress={onItemPress ? () => onItemPress(item) : undefined}
            />
          );
        }}
      />
    </ListScreenLayout>
  );
}

export function statusTone(status?: unknown): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  const value = String(status ?? '').toLowerCase();
  if (['success', 'completed', 'paid', 'active', 'ready', 'available', 'closed'].includes(value)) return 'success';
  if (['pending', 'open', 'preparing', 'reserved'].includes(value)) return 'warning';
  if (['cancelled', 'failed', 'void', 'inactive', 'closed_by_system'].includes(value)) return 'danger';
  if (['card', 'cash', 'served'].includes(value)) return 'info';
  return 'default';
}
