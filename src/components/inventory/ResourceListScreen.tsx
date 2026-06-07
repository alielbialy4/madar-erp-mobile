import React, { useCallback, useMemo, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { ListScreenLayout } from '@/components/layout';
import { AppDomainCard } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import type { ApiEnvelope, ListParams } from '@/types/api';
import { asText, dateText, money } from '@/utils/format';
import { moduleIcons } from '@/constants/iconMap';

type Props = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  loader: (params: ListParams) => Promise<ApiEnvelope<Record<string, unknown>[]>>;
  searchParam?: 'search' | 'q';
  extraParams?: Record<string, unknown>;
  onBack: () => void;
  onItemPress?: (item: Record<string, unknown>) => void;
  headerAction?: { label: string; onPress: () => void };
  mapRow: (row: Record<string, unknown>) => {
    title: string;
    subtitle: string;
    meta?: string;
    badgeLabel?: string;
    badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  };
  emptyTitle: string;
};

export function ResourceListScreen({
  title,
  subtitle,
  eyebrow = 'المخزون',
  loader,
  searchParam = 'search',
  extraParams,
  onBack,
  onItemPress,
  headerAction,
  mapRow,
  emptyTitle,
}: Props) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);

  const listParams = useMemo(
    () => ({ per_page: 50, ...extraParams, [searchParam]: debounced || undefined }),
    [debounced, extraParams, searchParam],
  );

  const { items, loading, refreshing, error, refresh, loadMore } = useListResource(loader, listParams);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <ListScreenLayout
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      searchValue={query}
      onSearchChange={setQuery}
      onRefresh={refresh}
      refreshing={refreshing}
      fab={headerAction ? { onPress: headerAction.onPress, label: headerAction.label } : undefined}
      hero={{
        eyebrow,
        title,
        subtitle,
        stats: [{ label: 'العناصر', value: items.length }],
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
        emptyCtaLabel={headerAction?.label}
        onEmptyCta={headerAction?.onPress}
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={({ item }) => {
          const model = mapRow(item);
          return (
            <AppDomainCard
              title={model.title}
              subtitle={model.subtitle}
              meta={model.meta}
              badgeLabel={model.badgeLabel}
              badgeTone={model.badgeTone}
              leadingIcon={model.icon ?? moduleIcons.inventory}
              onPress={onItemPress ? () => onItemPress(item) : undefined}
            />
          );
        }}
      />
    </ListScreenLayout>
  );
}

export function docRowTitle(row: Record<string, unknown>, fallback = '—'): string {
  return asText(row.reference_no ?? row.name ?? row.id, fallback);
}

export function docRowSubtitle(row: Record<string, unknown>): string {
  return [
    row.warehouse_name,
    row.status_label_ar ?? row.status,
    row.created_at ? dateText(String(row.created_at)) : undefined,
  ]
    .filter(Boolean)
    .join(' • ');
}

export function docRowMeta(row: Record<string, unknown>): string | undefined {
  const v = row.total ?? row.variance_total ?? row.items_count;
  if (v != null) return money(v);
  return undefined;
}
