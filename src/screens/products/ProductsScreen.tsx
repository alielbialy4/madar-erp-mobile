import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { productsAPI } from '@/api/products';
import { categoriesAPI } from '@/api/categories';
import { AppScreen } from '@/components/layout';
import { ProductsHero } from '@/components/products/ProductsHero';
import { ProductListCard } from '@/components/products/ProductListCard';
import { ProductFiltersPanel } from '@/components/products/ProductFiltersPanel';
import { ProductFiltersSheet } from '@/components/products/ProductFiltersSheet';
import { ProductsListToolbar } from '@/components/products/ProductsListToolbar';
import { productListStats } from '@/components/products/productUtils';
import type { ProductListFilters } from '@/components/lists/ListFiltersBar';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { extractArray } from '@/utils/data';
import { hasPermission } from '@/utils/permissions';
import { useAuthStore } from '@/store/authStore';
import { useColors } from '@/hooks/useColors';
import { contentAreaRtl, sidebarAreaRtl, tabletShellRow } from '@/constants/layout';
import {
  PRODUCTS_FILTER_SIDEBAR_WIDTH,
  getProductGridColumns,
} from '@/constants/productsLayout';
import type { Product, Category } from '@/types/api';
import type { ProductsStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductsHome'>;
type Route = RouteProp<ProductsStackParamList, 'ProductsHome'>;

export function ProductsScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const c = useColors();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 900;
  const gridColumns = getProductGridColumns(width, height);
  const isGrid = gridColumns > 1;
  const tabBarInset = useTabBarBottomInset(spacing.sm);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_products');
  const initialCategoryId = route.params?.category_id;
  const isRawMaterials = route.params?.scope === 'raw_materials';

  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ProductListFilters>({
    category_id: initialCategoryId ? String(initialCategoryId) : null,
    stock_status: null,
    featured: null,
  });

  const debounced = useDebouncedValue(query);
  const listParams = useMemo(
    () => ({
      search: debounced || undefined,
      category_id: !isRawMaterials && filters.category_id ? Number(filters.category_id) : undefined,
      stock_status: isRawMaterials
        ? filters.raw_status === 'low'
          ? 'low'
          : filters.stock_status ?? undefined
        : filters.stock_status ?? undefined,
      featured: !isRawMaterials ? filters.featured ?? undefined : undefined,
      active: isRawMaterials && filters.raw_status === 'inactive' ? 0 : undefined,
      product_role: isRawMaterials && filters.product_role ? filters.product_role : undefined,
      scope: isRawMaterials ? 'raw_materials' : undefined,
      include_raw_materials: isRawMaterials ? 1 : undefined,
      per_page: 50,
    }),
    [debounced, filters, isRawMaterials],
  );

  const { items: rawItems, loading, refreshing, error, refresh, loadMore } = useListResource<Product & Record<string, unknown>>(
    productsAPI.getAll,
    listParams,
  );

  const items = useMemo(() => {
    if (!isRawMaterials || filters.raw_status !== 'expiry') return rawItems;
    return rawItems.filter((p) => p.track_expiry === true || p.track_batch === true);
  }, [rawItems, isRawMaterials, filters.raw_status]);

  useEffect(() => {
    categoriesAPI.getAll({ per_page: 200 }).then((res) => setCategories(extractArray<Category>(res))).catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const stats = useMemo(() => productListStats(items as Product[]), [items]);
  const displayStats = useMemo(() => {
    if (!isRawMaterials) return stats;
    return {
      ...stats,
      promo: (items as Product[]).filter((p) => p.track_expiry || p.track_batch).length,
    };
  }, [isRawMaterials, items, stats]);

  const categoryHint = useMemo(() => {
    if (!filters.category_id) return null;
    return categories.find((cat) => String(cat.id) === filters.category_id)?.name ?? null;
  }, [categories, filters.category_id]);

  const heroProps = {
    totalCount: stats.total,
    lowStockCount: displayStats.low,
    outOfStockCount: displayStats.out,
    promoCount: displayStats.promo,
    isLoading: loading || refreshing,
    onRefresh: () => void refresh(),
    canManage,
    onCategories: isRawMaterials ? undefined : () => navigation.navigate('Categories'),
    onReorder: !isRawMaterials && canManage ? () => navigation.navigate('ProductsReorder') : undefined,
    onAdd: canManage ? () => navigation.navigate('ProductForm', isRawMaterials ? { mode: 'raw_material' } : {}) : undefined,
    categoryHint,
    title: isRawMaterials ? 'الخامات / المواد الخام' : undefined,
    addLabel: isRawMaterials ? 'خامة جديدة' : undefined,
    statLabels: isRawMaterials ? { promo: 'دفعات', metaSuffix: 'خامة في القائمة' } : undefined,
    eyebrow: isRawMaterials ? 'المخزون' : undefined,
    subtitle: isRawMaterials ? 'خامات الشراء والوصفات منفصلة عن كتالوج البيع.' : undefined,
  };

  const navigateDetail = useCallback(
    (item: Product) => {
      navigation.navigate('ProductDetail', {
        id: item.id,
        name: item.name,
        mode: isRawMaterials ? 'raw_material' : 'product',
      });
    },
    [navigation, isRawMaterials],
  );

  const navigateEdit = useCallback(
    (item: Product) => {
      navigation.navigate('ProductForm', {
        id: item.id,
        mode: isRawMaterials ? 'raw_material' : 'product',
      });
    },
    [navigation, isRawMaterials],
  );

  const navigateInsights = useCallback(
    (item: Product) => {
      navigation.navigate('ProductInsights', { id: item.id, name: item.name });
    },
    [navigation],
  );

  const cardVariant = isGrid ? 'grid' as const : 'compact' as const;

  const listHeader = (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: spacing.xs }}>
      <ProductsHero
        {...heroProps}
        compact
      />
      <ProductsListToolbar
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        onOpenFilters={isTablet ? undefined : () => setFiltersOpen(true)}
        rawMaterialMode={isRawMaterials}
        canManage={false}
        searchPlaceholder={isRawMaterials ? 'بحث بالاسم أو الكود...' : 'بحث بالاسم أو الباركود...'}
      />
    </View>
  );

  const renderProductItem = useCallback(
    ({ item }: { item: Product & Record<string, unknown> }) => {
      const product = item as Product;
      const card = (
        <ProductListCard
          product={product}
          canManage={canManage}
          variant={cardVariant}
          onPress={() => navigateDetail(product)}
          onInsights={() => navigateInsights(product)}
          onEdit={canManage ? () => navigateEdit(product) : undefined}
        />
      );
      if (isGrid) {
        return <View style={{ flex: 1, paddingHorizontal: spacing.xs }}>{card}</View>;
      }
      return card;
    },
    [canManage, cardVariant, isGrid, navigateDetail, navigateEdit, navigateInsights],
  );

  const listBody = (
    <FlatList
      key={isGrid ? `products-grid-${gridColumns}` : 'products-list'}
      data={items}
      numColumns={gridColumns}
      keyExtractor={(item, index) => `prod-${String(item.id)}-${index}`}
      ListHeaderComponent={listHeader}
      contentContainerStyle={{
        paddingBottom: tabBarInset,
        ...(isGrid ? { paddingHorizontal: spacing.md } : { paddingHorizontal: spacing.lg }),
      }}
      columnWrapperStyle={isGrid ? { gap: spacing.sm, marginBottom: spacing.sm } : undefined}
      ItemSeparatorComponent={isGrid ? undefined : () => <View style={{ height: 0 }} />}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={c.accent} />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      ListEmptyComponent={
        <AppEmptyState title="لا توجد منتجات" message={canManage ? 'أضف أول منتج أو غيّر الفلاتر' : undefined} />
      }
      renderItem={renderProductItem}
    />
  );

  return (
    <AppScreen
      title={isRawMaterials ? 'الخامات / المواد الخام' : 'المنتجات'}
      scroll={false}
      noHeader
      contentStyle={{ padding: 0, gap: 0 }}
    >
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
              width: PRODUCTS_FILTER_SIDEBAR_WIDTH,
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
              <ProductFiltersPanel
                categories={categories}
                filters={filters}
                onChange={setFilters}
                resultCount={items.length}
                layout="sidebar"
                rawMaterialMode={isRawMaterials}
              />
            </ScrollView>
          </View>
        </View>
      ) : (
        <>
          <View style={{ ...contentAreaRtl, flex: 1 }}>{listBody}</View>
          <ProductFiltersSheet
            visible={filtersOpen}
            categories={categories}
            filters={filters}
            resultCount={items.length}
            rawMaterialMode={isRawMaterials}
            onClose={() => setFiltersOpen(false)}
            onApply={setFilters}
          />
        </>
      )}
    </AppScreen>
  );
}
