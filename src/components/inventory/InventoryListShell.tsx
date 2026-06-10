import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '@/components/layout';
import { InventoryListToolbar } from '@/components/inventory/InventoryListToolbar';
import { InventoryFiltersPanel } from '@/components/inventory/InventoryFiltersPanel';
import { InventoryFiltersSheet } from '@/components/inventory/InventoryFiltersSheet';
import { InventoryScopeBanner } from '@/components/inventory/InventoryScopeBanner';
import { InventoryTableDataRow, InventoryTableHeaderRow } from '@/components/inventory/InventoryListTable';
import { getInventoryTableConfig } from '@/components/inventory/inventoryTableConfig';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { useInventoryScope } from '@/hooks/useInventoryScope';
import { useColors } from '@/hooks/useColors';
import { contentAreaRtl, sidebarAreaRtl, tabletShellRow } from '@/constants/layout';
import {
  EMPTY_INVENTORY_FILTERS,
  INVENTORY_FILTER_SIDEBAR_WIDTH,
  inventoryFiltersToApiParams,
  type InventoryListFilters,
} from '@/constants/inventoryLayout';
import type { InventoryFilterKey, InventoryListSurface } from '@/components/inventory/inventoryListPresets';
import type { ApiEnvelope, ListParams } from '@/types/api';
import { spacing, radius } from '@/constants/spacing';

export type InventoryListLayout = 'table' | 'cards';

type Props<T extends Record<string, unknown>> = {
  title: string;
  onBack: () => void;
  surface: InventoryListSurface;
  loader: (params: ListParams) => Promise<ApiEnvelope<T[]>>;
  searchParam?: 'search' | 'q';
  searchEnabled?: boolean;
  searchPlaceholder?: string;
  supportedFilters?: InventoryFilterKey[];
  defaultParams?: Record<string, unknown>;
  fixedParams?: Record<string, unknown>;
  initialFilters?: Partial<InventoryListFilters>;
  lockedWarehouseId?: string;
  warehouseName?: string;
  renderItem?: (item: T, variant: 'compact' | 'grid') => React.ReactNode;
  onItemPress?: (item: T) => void;
  layout?: InventoryListLayout;
  keyExtractor?: (item: T, index: number) => string;
  listHeader?: React.ReactNode;
  canManage?: boolean;
  onAdd?: () => void;
  emptyTitle: string;
  emptyMessage?: string;
  showScopeBanner?: boolean;
  scopeBannerVariant?: 'general' | 'directory';
  onItemsChange?: (items: T[]) => void;
};

export function InventoryListShell<T extends Record<string, unknown>>({
  title,
  onBack,
  surface,
  loader,
  searchParam = 'search',
  searchEnabled = true,
  searchPlaceholder,
  supportedFilters = [],
  defaultParams,
  fixedParams,
  initialFilters,
  lockedWarehouseId,
  warehouseName,
  renderItem,
  onItemPress,
  layout = 'table',
  keyExtractor,
  listHeader,
  canManage,
  onAdd,
  emptyTitle,
  emptyMessage,
  showScopeBanner = true,
  scopeBannerVariant = 'general',
  onItemsChange,
}: Props<T>) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const tabBarInset = useTabBarBottomInset(spacing.sm);
  const scope = useInventoryScope();
  const tableConfig = useMemo(() => getInventoryTableConfig(surface), [surface]);
  const useTable = layout === 'table' && tableConfig != null;

  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<InventoryListFilters>(() => ({
    ...EMPTY_INVENTORY_FILTERS,
    ...initialFilters,
    ...(lockedWarehouseId ? { warehouse_id: lockedWarehouseId } : {}),
  }));

  const debounced = useDebouncedValue(query);
  const filterParams = useMemo(
    () => inventoryFiltersToApiParams(surface, filters, scope),
    [surface, filters, scope],
  );

  const listParams = useMemo(
    () => ({
      per_page: 50,
      ...defaultParams,
      ...fixedParams,
      ...filterParams,
      ...(searchEnabled && debounced ? { [searchParam]: debounced } : {}),
    }),
    [defaultParams, fixedParams, filterParams, searchEnabled, debounced, searchParam],
  );

  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<T>(loader, listParams);

  useEffect(() => {
    onItemsChange?.(items);
  }, [items, onItemsChange]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const headerBlock = (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: spacing.xs }}>
      {showScopeBanner ? <InventoryScopeBanner variant={scopeBannerVariant} /> : null}
      {listHeader}
      <InventoryListToolbar
        surface={surface}
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
        onOpenFilters={supportedFilters.length > 0 ? (isTablet ? undefined : () => setFiltersOpen(true)) : undefined}
        canManage={canManage && !isTablet}
        onAdd={!isTablet ? onAdd : undefined}
        searchPlaceholder={searchPlaceholder}
        searchEnabled={searchEnabled}
        warehouseName={warehouseName}
      />
    </View>
  );

  const tableWrapper = useTable && tableConfig ? (
    <View
      style={{
        marginHorizontal: spacing.lg,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: c.borderSubtle,
        backgroundColor: c.surface,
        overflow: 'hidden',
      }}
    >
      <InventoryTableHeaderRow columns={tableConfig.columns} showChevron={Boolean(onItemPress)} />
    </View>
  ) : null;

  const renderTableRow = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      if (!tableConfig) return null;
      return (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <View
            style={{
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderBottomWidth: index === items.length - 1 ? 1 : 0,
              borderColor: c.borderSubtle,
              backgroundColor: c.surface,
              borderBottomLeftRadius: index === items.length - 1 ? radius.xl : 0,
              borderBottomRightRadius: index === items.length - 1 ? radius.xl : 0,
              overflow: 'hidden',
            }}
          >
            <InventoryTableDataRow
              columns={tableConfig.columns}
              cells={tableConfig.mapRow(item)}
              showChevron={Boolean(onItemPress)}
              onPress={onItemPress ? () => onItemPress(item) : undefined}
              isLast={index === items.length - 1}
            />
          </View>
        </View>
      );
    },
    [tableConfig, onItemPress, items.length, c.borderSubtle, c.surface],
  );

  const renderCardItem = useCallback(
    ({ item }: { item: T }): React.ReactElement | null => {
      if (!renderItem) return null;
      return <>{renderItem(item, 'compact')}</>;
    },
    [renderItem],
  );

  const listBody = (
    <FlatList
      key={useTable ? `inv-table-${surface}` : `inv-cards-${surface}`}
      data={items}
      keyExtractor={keyExtractor ?? ((item, index) => `${surface}-${String(item.id ?? index)}-${index}`)}
      ListHeaderComponent={
        <>
          {headerBlock}
          {tableWrapper}
        </>
      }
      contentContainerStyle={{ paddingBottom: tabBarInset }}
      ItemSeparatorComponent={useTable ? undefined : () => <View style={{ height: spacing.sm }} />}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={c.accent} />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      ListEmptyComponent={
        !loading ? (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <AppEmptyState title={emptyTitle} message={emptyMessage} />
          </View>
        ) : null
      }
      renderItem={useTable ? renderTableRow : renderCardItem}
    />
  );

  return (
    <AppScreen title={title} onBack={onBack} scroll={false} contentStyle={{ padding: 0, gap: 0 }}>
      {loading && items.length === 0 ? (
        <AppLoadingState variant="skeleton" skeletonRows={8} />
      ) : error && items.length === 0 ? (
        <AppErrorState message={error} onRetry={() => void refresh()} />
      ) : isTablet && supportedFilters.length > 0 ? (
        <View style={tabletShellRow}>
          <View style={contentAreaRtl}>{listBody}</View>
          <View
            style={{
              ...sidebarAreaRtl,
              width: INVENTORY_FILTER_SIDEBAR_WIDTH,
              borderLeftWidth: 1,
              borderLeftColor: c.borderSubtle,
              backgroundColor: c.surface,
            }}
          >
            <ScrollView
              contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <InventoryFiltersPanel
                surface={surface}
                filters={filters}
                onChange={setFilters}
                resultCount={items.length}
                supportedFilters={supportedFilters}
                layout="sidebar"
                lockedWarehouseId={lockedWarehouseId}
              />
            </ScrollView>
          </View>
        </View>
      ) : (
        <>
          <View style={{ ...contentAreaRtl, flex: 1 }}>{listBody}</View>
          {supportedFilters.length > 0 ? (
            <InventoryFiltersSheet
              visible={filtersOpen}
              surface={surface}
              filters={filters}
              resultCount={items.length}
              supportedFilters={supportedFilters}
              onClose={() => setFiltersOpen(false)}
              onApply={setFilters}
              lockedWarehouseId={lockedWarehouseId}
            />
          ) : null}
        </>
      )}
    </AppScreen>
  );
}
