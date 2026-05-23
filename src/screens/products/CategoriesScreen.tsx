import React, { useCallback, useMemo, useState } from 'react';
import { Text } from '@/components/ui/AppText';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { categoriesAPI } from '@/api/categories';
import { AppScreen } from '@/components/layout';
import { CategoriesHero } from '@/components/categories/CategoriesHero';
import { CategoryListCard } from '@/components/categories/CategoryListCard';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { createInventoryUiStyles } from '@/components/inventory/inventoryUiStyles';
import { AppEmptyState, AppErrorState, AppLoadingState, ConfirmDialog } from '@/components/feedback';
import { AppInput } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { useAuthStore } from '@/store/authStore';
import { useColors } from '@/hooks/useColors';
import { hasPermission } from '@/utils/permissions';
import { normalizeApiError } from '@/utils/errors';
import type { Category } from '@/types/api';
import type { ProductsStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'Categories'>;
type StatusFilter = 'all' | 'active' | 'inactive';

export function CategoriesScreen({ navigation }: { navigation: Nav }) {
  const c = useColors();
  const cs = useMemo(() => createCategoryStyles(c), [c]);
  const ui = useMemo(() => createInventoryUiStyles(c), [c]);
  const tabBarInset = useTabBarBottomInset(spacing.lg);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_categories');

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const debounced = useDebouncedValue(query);
  const params = { search: debounced || undefined, per_page: 50 };

  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Category & Record<string, unknown>>(
    categoriesAPI.getAll,
    params,
  );

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === 'active') return item.active !== false;
      if (statusFilter === 'inactive') return item.active === false;
      return true;
    });
  }, [items, statusFilter]);

  const stats = useMemo(() => {
    const activeCount = items.filter((i) => i.active !== false).length;
    return { total: items.length, active: activeCount };
  }, [items]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await categoriesAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'active', label: 'نشط' },
    { key: 'inactive', label: 'غير نشط' },
  ];

  const listHeader = (
    <View style={cs.pageHeader}>
      <CategoriesHero
        totalCount={stats.total}
        activeCount={stats.active}
        isLoading={loading || refreshing}
        onRefresh={() => void refresh()}
        canManage={canManage}
        onAdd={canManage ? () => navigation.navigate('CategoryForm', {}) : undefined}
        onReorder={canManage ? () => navigation.navigate('CategoriesReorder') : undefined}
        onProducts={() => navigation.navigate('ProductsHome')}
      />

      <View style={cs.searchWrap}>
        <MaterialIcons name="search" size={22} color={c.textCaption} />
        <View style={cs.searchInput}>
          <AppInput value={query} onChangeText={setQuery} placeholder="بحث باسم التصنيف..." />
        </View>
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <MaterialIcons name="close" size={20} color={c.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ gap: spacing.sm }}>
        <View style={ui.chipsWrap}>
          {filters.map((f) => {
            const active = statusFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setStatusFilter(f.key)}
                style={[cs.filterPill, active && cs.filterPillActive]}
              >
                <Text style={[cs.filterText, active && cs.filterTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={cs.sectionLabel}>
          {filteredItems.length} تصنيف{statusFilter !== 'all' ? ' (مفلتر)' : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <AppScreen title="التصنيفات" onBack={() => navigation.goBack()} scroll={false} contentStyle={{ padding: 0, gap: 0 }}>
      {loading && items.length === 0 ? (
        <AppLoadingState />
      ) : error && items.length === 0 ? (
        <AppErrorState message={error} onRetry={() => void refresh()} />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => `cat-${String(item.id)}-${index}`}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[cs.listContent, { paddingBottom: tabBarInset }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={c.accent} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={
            <AppEmptyState
              title="لا توجد تصنيفات"
              message={canManage ? 'أنشئ أول تصنيف لتنظيم المنتجات في نقطة البيع' : undefined}
            />
          }
          renderItem={({ item }) => (
            <CategoryListCard
              category={item}
              canManage={canManage}
              onPress={() =>
                canManage
                  ? navigation.navigate('CategoryForm', { id: item.id })
                  : navigation.navigate('ProductsHome', { category_id: item.id })
              }
              onProducts={() => navigation.navigate('ProductsHome', { category_id: item.id })}
              onEdit={() => navigation.navigate('CategoryForm', { id: item.id })}
              onDelete={() => setDeleteTarget(item)}
            />
          )}
        />
      )}

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="حذف التصنيف"
        message={`هل تريد حذف «${deleteTarget?.name ?? ''}»؟ لا يمكن التراجع.`}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppScreen>
  );
}
