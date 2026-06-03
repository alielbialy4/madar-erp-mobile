import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { productsAPI } from '@/api/products';
import { categoriesAPI } from '@/api/categories';
import { AppScreen } from '@/components/layout';
import { ProductsHero } from '@/components/products/ProductsHero';
import { ProductListCard } from '@/components/products/ProductListCard';
import { ProductFiltersPanel } from '@/components/products/ProductFiltersPanel';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { productListStats } from '@/components/products/productUtils';
import type { ProductListFilters } from '@/components/lists/ListFiltersBar';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { AppInput } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { extractArray } from '@/utils/data';
import { hasPermission } from '@/utils/permissions';
import { useAuthStore } from '@/store/authStore';
import { useColors } from '@/hooks/useColors';
import type { Product, Category } from '@/types/api';
import type { ProductsStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductsHome'>;
type Route = RouteProp<ProductsStackParamList, 'ProductsHome'>;

const FILTER_SIDEBAR_WIDTH = 272;

export function ProductsScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const cs = useMemo(() => createCategoryStyles(c), [c]);
  const tabBarInset = useTabBarBottomInset(spacing.sm);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_products');
  const initialCategoryId = route.params?.category_id;
  const isRawMaterials = route.params?.scope === 'raw_materials';

  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
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

  const searchBar = (
    <View style={[cs.searchWrap, isTablet && { marginBottom: 0 }]}>
      <MaterialIcons name="search" size={22} color={c.textCaption} />
      <View style={cs.searchInput}>
        <AppInput value={query} onChangeText={setQuery} placeholder="بحث بالاسم أو الباركود..." />
      </View>
      {query.length > 0 ? (
        <Pressable onPress={() => setQuery('')} hitSlop={8}>
          <MaterialIcons name="close" size={20} color={c.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );

  const listHeaderPhone = (
    <View style={cs.pageHeader}>
      <ProductsHero
        compact
        totalCount={stats.total}
        lowStockCount={displayStats.low}
        outOfStockCount={displayStats.out}
        promoCount={displayStats.promo}
        isLoading={loading || refreshing}
        onRefresh={() => void refresh()}
        canManage={canManage}
        onCategories={isRawMaterials ? undefined : () => navigation.navigate('Categories')}
        onReorder={!isRawMaterials && canManage ? () => navigation.navigate('ProductsReorder') : undefined}
        onAdd={canManage ? () => navigation.navigate('ProductForm', isRawMaterials ? { mode: 'raw_material' } : {}) : undefined}
        categoryHint={categoryHint}
        title={isRawMaterials ? 'الخامات / المواد الخام' : undefined}
        addLabel={isRawMaterials ? 'خامة جديدة' : undefined}
        statLabels={isRawMaterials ? { promo: 'دفعات', metaSuffix: 'خامة في القائمة' } : undefined}
      />
      {searchBar}
      <ProductFiltersPanel
        categories={categories}
        filters={filters}
        onChange={setFilters}
        resultCount={items.length}
        rawMaterialMode={isRawMaterials}
      />
    </View>
  );

  const listHeaderTablet = (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md }}>
      <ProductsHero
        totalCount={stats.total}
        lowStockCount={displayStats.low}
        outOfStockCount={displayStats.out}
        promoCount={displayStats.promo}
        isLoading={loading || refreshing}
        onRefresh={() => void refresh()}
        canManage={canManage}
        onCategories={isRawMaterials ? undefined : () => navigation.navigate('Categories')}
        onReorder={!isRawMaterials && canManage ? () => navigation.navigate('ProductsReorder') : undefined}
        onAdd={canManage ? () => navigation.navigate('ProductForm', isRawMaterials ? { mode: 'raw_material' } : {}) : undefined}
        categoryHint={categoryHint}
        eyebrow={isRawMaterials ? 'المخزون' : undefined}
        title={isRawMaterials ? 'الخامات / المواد الخام' : undefined}
        subtitle={isRawMaterials ? 'خامات الشراء والوصفات منفصلة عن كتالوج البيع.' : undefined}
        addLabel={isRawMaterials ? 'خامة جديدة' : undefined}
        statLabels={isRawMaterials ? { promo: 'دفعات', metaSuffix: 'خامة في القائمة' } : undefined}
      />
      {searchBar}
    </View>
  );

  const listBody = (
    <FlatList
      data={items}
      keyExtractor={(item, index) => `prod-${String(item.id)}-${index}`}
      ListHeaderComponent={isTablet ? listHeaderTablet : listHeaderPhone}
      contentContainerStyle={[cs.listContent, { paddingBottom: tabBarInset, gap: undefined }]}
      ItemSeparatorComponent={() => <View style={cs.listSeparator} />}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={c.accent} />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      ListEmptyComponent={
        <AppEmptyState title="لا توجد منتجات" message={canManage ? 'أضف أول منتج أو غيّر الفلاتر' : undefined} />
      }
      renderItem={({ item }) => (
        <ProductListCard
          product={item as Product}
          canManage={canManage}
          onPress={() => navigation.navigate('ProductDetail', { id: item.id, name: item.name, mode: isRawMaterials ? 'raw_material' : 'product' })}
          onInsights={() => navigation.navigate('ProductInsights', { id: item.id, name: item.name })}
          onEdit={canManage ? () => navigation.navigate('ProductForm', { id: item.id, mode: isRawMaterials ? 'raw_material' : 'product' }) : undefined}
        />
      )}
    />
  );

  return (
    <AppScreen title={isRawMaterials ? 'الخامات / المواد الخام' : 'المنتجات'} scroll={false} noHeader contentStyle={{ padding: 0, gap: 0 }}>
      {loading && items.length === 0 ? (
        <AppLoadingState variant="skeleton" skeletonRows={8} />
      ) : error && items.length === 0 ? (
        <AppErrorState message={error} onRetry={() => void refresh()} />
      ) : isTablet ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1, minWidth: 0 }}>{listBody}</View>
          <View
            style={{
              width: FILTER_SIDEBAR_WIDTH,
              borderStartWidth: 1,
              borderStartColor: c.borderSubtle,
              backgroundColor: c.surface,
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <View style={{ ...cs.searchWrap, marginBottom: 0 }}>
              <MaterialIcons name="tune" size={20} color={c.accent} />
              <View style={{ flex: 1 }}>
                <AppInput value={query} onChangeText={setQuery} placeholder="بحث سريع..." />
              </View>
            </View>
            <ProductFiltersPanel
              categories={categories}
              filters={filters}
              onChange={setFilters}
              resultCount={items.length}
              layout="sidebar"
              rawMaterialMode={isRawMaterials}
            />
          </View>
        </View>
      ) : (
        listBody
      )}
    </AppScreen>
  );
}
