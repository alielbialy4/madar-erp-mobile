import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '@/components/layout';
import { InventoryHero } from '@/components/inventory/InventoryHero';
import { InventoryListCard } from '@/components/inventory/InventoryListCard';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { AppInput } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { useColors } from '@/hooks/useColors';
import type { ApiEnvelope, ListParams } from '@/types/api';
import { spacing } from '@/constants/spacing';
import { asText, dateText, money } from '@/utils/format';

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
  const c = useColors();
  const cs = useMemo(() => createCategoryStyles(c), [c]);
  const tabBarInset = useTabBarBottomInset(spacing.lg);
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

  const listHeader = (
    <View style={cs.pageHeader}>
      <InventoryHero
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        stats={[{ label: 'العناصر', value: items.length }]}
        metaLabel={`${items.length} سجل`}
        isLoading={loading || refreshing}
        onRefresh={() => void refresh()}
        chips={
          headerAction
            ? [{ label: headerAction.label, icon: 'add', onPress: headerAction.onPress, primary: true }]
            : undefined
        }
      />
      <View style={cs.searchWrap}>
        <MaterialIcons name="search" size={22} color={c.textCaption} />
        <View style={cs.searchInput}>
          <AppInput value={query} onChangeText={setQuery} placeholder="بحث..." />
        </View>
      </View>
    </View>
  );

  return (
    <AppScreen title={title} onBack={onBack} scroll={false} contentStyle={{ padding: 0, gap: 0 }}>
      {loading && items.length === 0 ? <AppLoadingState /> : null}
      {error && items.length === 0 ? <AppErrorState message={error} onRetry={() => void refresh()} /> : null}
      {!error || items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(item, index) => String(item.id ?? index)}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[cs.listContent, { paddingBottom: tabBarInset }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={c.accent} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={!loading ? <AppEmptyState title={emptyTitle} /> : null}
          renderItem={({ item }) => {
            const model = mapRow(item);
            return (
              <InventoryListCard
                {...model}
                onPress={onItemPress ? () => onItemPress(item) : undefined}
              />
            );
          }}
        />
      ) : null}
    </AppScreen>
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
