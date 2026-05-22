import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ApiEnvelope, ListParams } from '@/types/api';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppInput, AppListItem } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { spacing } from '@/constants/spacing';
import { asText, dateText, money } from '@/utils/format';

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
};

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
}: Props<T>) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const listParams = useMemo(() => ({ ...(params ?? {}), ...(debounced ? { [searchParam]: debounced } : {}) }), [debounced, params, searchParam]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<T>(loader, listParams);

  return (
    <AppScreen title={title} subtitle={subtitle} scroll={false} headerRight={headerRight} noHeader={noHeader}>
      <View style={styles.searchWrap}>
        <AppInput value={query} onChangeText={setQuery} placeholder="بحث..." returnKeyType="search" />
      </View>
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle={emptyTitle}
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={({ item }) => {
          const badge = itemBadge?.(item);
          return (
            <AppListItem
              title={itemTitle(item)}
              subtitle={itemSubtitle?.(item)}
              meta={itemMeta?.(item)}
              badge={badge ? <AppBadge label={badge.label} tone={badge.tone} /> : undefined}
              onPress={onItemPress ? () => onItemPress(item) : undefined}
            />
          );
        }}
      />
    </AppScreen>
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

export const listFormatters = {
  title: (item: Record<string, unknown>) => asText(item.name ?? item.invoice_number ?? item.reference_no ?? item.code ?? item.id),
  total: (item: Record<string, unknown>) => money(item.total ?? item.amount ?? item.balance ?? 0),
  date: (item: Record<string, unknown>) => dateText(asText(item.created_at ?? item.purchase_date ?? item.expense_date, '')),
};

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
});
