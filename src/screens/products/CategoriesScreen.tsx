import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { categoriesAPI } from '@/api/categories';
import { AppScreen } from '@/components/layout';
import { CategoriesHero } from '@/components/categories/CategoriesHero';
import { CategoryListCard } from '@/components/categories/CategoryListCard';
import { CategoriesListToolbar } from '@/components/categories/CategoriesListToolbar';
import { CategoryFiltersPanel } from '@/components/categories/CategoryFiltersPanel';
import { CategoryFiltersSheet } from '@/components/categories/CategoryFiltersSheet';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { useAuthStore } from '@/store/authStore';
import { useColors } from '@/hooks/useColors';
import { hasPermission } from '@/utils/permissions';
import { contentAreaRtl, sidebarAreaRtl, tabletShellRow } from '@/constants/layout';
import {
  CATEGORIES_FILTER_SIDEBAR_WIDTH,
  categoryFiltersToApiParams,
  categoryListStats,
  EMPTY_CATEGORY_FILTERS,
  getCategoryGridColumns,
  type CategoryListFilters,
} from '@/constants/categoriesLayout';
import type { Category } from '@/types/api';
import type { ProductsStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'Categories'>;

export function CategoriesScreen({ navigation }: { navigation: Nav }) {
  const c = useColors();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 900;
  const gridColumns = getCategoryGridColumns(width, height);
  const isGrid = gridColumns > 1;
  const tabBarInset = useTabBarBottomInset(spacing.sm);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_categories');

  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<CategoryListFilters>({ ...EMPTY_CATEGORY_FILTERS });

  const debounced = useDebouncedValue(query);
  const listParams = useMemo(
    () => ({
      search: debounced || undefined,
      ...categoryFiltersToApiParams(filters),
      per_page: 50,
    }),
    [debounced, filters],
  );

  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Category & Record<string, unknown>>(
    categoriesAPI.getAll,
    listParams,
  );

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const stats = useMemo(() => categoryListStats(items), [items]);

  const heroProps = {
    totalCount: stats.total,
    activeCount: stats.active,
    inactiveCount: stats.inactive,
    productsTotal: stats.productsTotal,
    isLoading: loading || refreshing,
    onRefresh: () => void refresh(),
    canManage,
    onAdd: canManage ? () => navigation.navigate('CategoryForm', {}) : undefined,
    onReorder: canManage ? () => navigation.navigate('CategoriesReorder') : undefined,
    onProducts: () => navigation.navigate('ProductsHome'),
  };

  const navigateDetail = useCallback(
    (item: Category) => {
      navigation.navigate('CategoryDetail', { id: item.id, name: item.name });
    },
    [navigation],
  );

  const navigateEdit = useCallback(
    (item: Category) => {
      navigation.navigate('CategoryForm', { id: item.id });
    },
    [navigation],
  );

  const cardVariant = isGrid ? ('grid' as const) : ('compact' as const);

  const listHeader = (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: spacing.xs }}>
      {isTablet ? (
        <CategoriesHero {...heroProps} showActions />
      ) : (
        <CategoriesHero
          {...heroProps}
          statsOnly
          showActions={Boolean(heroProps.onAdd || heroProps.onReorder || heroProps.onProducts)}
          compact
        />
      )}
      <CategoriesListToolbar
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
        onOpenFilters={isTablet ? undefined : () => setFiltersOpen(true)}
        canManage={canManage && !isTablet}
        onAdd={!isTablet && canManage ? heroProps.onAdd : undefined}
      />
    </View>
  );

  const renderCategoryItem = useCallback(
    ({ item }: { item: Category & Record<string, unknown> }) => {
      const category = item as Category;
      const card = (
        <CategoryListCard
          category={category}
          canManage={canManage}
          variant={cardVariant}
          onPress={() => navigateDetail(category)}
          onEdit={canManage ? () => navigateEdit(category) : undefined}
        />
      );
      if (isGrid) {
        return <View style={{ flex: 1, paddingHorizontal: spacing.xs }}>{card}</View>;
      }
      return card;
    },
    [canManage, cardVariant, isGrid, navigateDetail, navigateEdit],
  );

  const listBody = (
    <FlatList
      key={isGrid ? `categories-grid-${gridColumns}` : 'categories-list'}
      data={items}
      numColumns={gridColumns}
      keyExtractor={(item, index) => `cat-${String(item.id)}-${index}`}
      ListHeaderComponent={listHeader}
      contentContainerStyle={{
        paddingBottom: tabBarInset,
        ...(isGrid ? { paddingHorizontal: spacing.md } : { paddingHorizontal: spacing.lg }),
      }}
      columnWrapperStyle={isGrid ? { gap: spacing.sm, marginBottom: spacing.sm } : undefined}
      ItemSeparatorComponent={isGrid ? undefined : () => <View style={{ height: spacing.sm }} />}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={c.accent} />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      ListEmptyComponent={
        <AppEmptyState
          title="لا توجد تصنيفات"
          message={canManage ? 'أنشئ أول تصنيف أو غيّر الفلاتر' : undefined}
        />
      }
      renderItem={renderCategoryItem}
    />
  );

  return (
    <AppScreen title="التصنيفات" onBack={() => navigation.goBack()} scroll={false} contentStyle={{ padding: 0, gap: 0 }}>
      {loading && items.length === 0 ? (
        <AppLoadingState variant="skeleton" skeletonRows={8} />
      ) : error && items.length === 0 ? (
        <AppErrorState message={error} onRetry={() => void refresh()} />
      ) : isTablet ? (
        <View style={tabletShellRow}>
          <View style={contentAreaRtl}>{listBody}</View>
          <View
            style={{
              ...sidebarAreaRtl,
              width: CATEGORIES_FILTER_SIDEBAR_WIDTH,
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
              <CategoryFiltersPanel
                filters={filters}
                onChange={setFilters}
                resultCount={items.length}
                layout="sidebar"
              />
            </ScrollView>
          </View>
        </View>
      ) : (
        <>
          <View style={{ ...contentAreaRtl, flex: 1 }}>{listBody}</View>
          <CategoryFiltersSheet
            visible={filtersOpen}
            filters={filters}
            resultCount={items.length}
            onClose={() => setFiltersOpen(false)}
            onApply={setFilters}
          />
        </>
      )}
    </AppScreen>
  );
}
