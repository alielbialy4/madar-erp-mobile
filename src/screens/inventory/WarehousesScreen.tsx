import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { warehousesAPI } from '@/api/inventory';
import { AppScreen } from '@/components/layout';
import { WarehousesHero } from '@/components/inventory/WarehousesHero';
import { WarehouseListCard } from '@/components/inventory/WarehouseListCard';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { AppEmptyState, AppErrorState, AppLoadingState, ConfirmDialog } from '@/components/feedback';
import { AppInput } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { useInventoryDirectoryAccess } from '@/hooks/useInventoryDirectoryAccess';
import { useColors } from '@/hooks/useColors';
import { createInventoryUiStyles } from '@/components/inventory/inventoryUiStyles';
import { normalizeApiError } from '@/utils/errors';
import type { Warehouse } from '@/types/api';
import type { MoreStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'Warehouses'>;
type StatusFilter = 'all' | 'active' | 'inactive';

export function WarehousesScreen({ navigation }: { navigation: Nav }) {
  const c = useColors();
  const cs = useMemo(() => createCategoryStyles(c), [c]);
  const ui = useMemo(() => createInventoryUiStyles(c), [c]);
  const tabBarInset = useTabBarBottomInset(spacing.lg);
  const { canManage, readOnlyHint } = useInventoryDirectoryAccess();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const debounced = useDebouncedValue(query);
  const listParams = useMemo(
    () => ({
      search: debounced || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter === 'active' ? 'active' : 'inactive',
      per_page: 50,
    }),
    [debounced, statusFilter],
  );

  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Warehouse & Record<string, unknown>>(
    warehousesAPI.list,
    listParams,
  );

  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') return items;
    return items.filter((w) =>
      statusFilter === 'active' ? w.status !== 'inactive' : w.status === 'inactive',
    );
  }, [items, statusFilter]);

  const stats = useMemo(() => {
    const active = items.filter((w) => w.status !== 'inactive').length;
    return { total: items.length, active };
  }, [items]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await warehousesAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setDeleteTarget(null);
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
      <WarehousesHero
        totalCount={stats.total}
        activeCount={stats.active}
        isLoading={loading || refreshing}
        onRefresh={() => void refresh()}
        canManage={canManage}
        onAdd={canManage ? () => navigation.navigate('WarehouseForm', {}) : undefined}
        readOnlyHint={readOnlyHint}
      />
      <View style={cs.searchWrap}>
        <MaterialIcons name="search" size={22} color={c.textCaption} />
        <View style={cs.searchInput}>
          <AppInput value={query} onChangeText={setQuery} placeholder="بحث بالاسم أو الكود..." />
        </View>
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <MaterialIcons name="close" size={20} color={c.textMuted} />
          </Pressable>
        ) : null}
      </View>
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
      <Text style={cs.sectionLabel}>{filteredItems.length} مخزن</Text>
    </View>
  );

  return (
    <AppScreen title="المخازن" onBack={navigation.goBack} scroll={false} contentStyle={{ padding: 0, gap: 0 }}>
      {loading && items.length === 0 ? (
        <AppLoadingState />
      ) : error && items.length === 0 ? (
        <AppErrorState message={error} onRetry={() => void refresh()} />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => `wh-${String(item.id)}-${index}`}
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
              title="لا توجد مخازن"
              message={canManage ? 'أنشئ أول مخزن لتنظيم الأرصدة والتحويلات' : undefined}
            />
          }
          renderItem={({ item }) => (
            <WarehouseListCard
              warehouse={item as Warehouse}
              canManage={canManage}
              onPress={() => navigation.navigate('WarehouseDetail', { id: item.id, name: item.name })}
              onBalances={() =>
                navigation.navigate('InventoryList', {
                  preset: 'balances',
                  warehouse_id: String(item.id),
                  warehouse_name: item.name,
                })
              }
              onEdit={canManage ? () => navigation.navigate('WarehouseForm', { id: item.id }) : undefined}
              onDelete={canManage ? () => setDeleteTarget(item as Warehouse) : undefined}
            />
          )}
        />
      )}

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="حذف المخزن"
        message={`هل تريد حذف «${deleteTarget?.name ?? ''}»؟ لا يمكن الحذف إذا كان هناك رصيد.`}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppScreen>
  );
}
