import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { warehousesAPI } from '@/api/inventory';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { get } from '@/api/client';
import { AppScreen } from '@/components/layout';
import { InventoryHero } from '@/components/inventory/InventoryHero';
import { InventoryListCard } from '@/components/inventory/InventoryListCard';
import { INVENTORY_LIST_PRESETS } from '@/components/inventory/inventoryListPresets';
import { mapInventoryRow } from '@/components/inventory/inventoryRowUtils';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { AppInput, AppSelect } from '@/components/ui';
import type { SelectOption } from '@/components/ui/AppSelect';
import { extractArray } from '@/utils/data';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { useColors } from '@/hooks/useColors';
import type { ApiEnvelope, ListParams } from '@/types/api';
import type { InventoryListPresetKey, MoreStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'InventoryList'>;
type Route = RouteProp<MoreStackParamList, 'InventoryList'>;

const PRESET_ICONS: Record<InventoryListPresetKey, React.ComponentProps<typeof MaterialIcons>['name']> = {
  balances: 'inventory-2',
  warehouses: 'warehouse',
  movements: 'sync-alt',
  expiry: 'event-busy',
  reorderRules: 'rule',
  requisitions: 'assignment',
  stockCounts: 'fact-check',
};

export function InventoryListScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const presetKey = route.params.preset;
  const warehouseId = route.params.warehouse_id;
  const warehouseName = route.params.warehouse_name;
  const preset = INVENTORY_LIST_PRESETS[presetKey];
  const c = useColors();

  useEffect(() => {
    if (presetKey === 'warehouses') {
      navigation.replace('Warehouses');
    }
  }, [navigation, presetKey]);

  const cs = useMemo(() => createCategoryStyles(c), [c]);
  const tabBarInset = useTabBarBottomInset(spacing.lg);
  const [query, setQuery] = useState('');
  const [filterWarehouseId, setFilterWarehouseId] = useState(warehouseId ?? '');
  const [filterProductId, setFilterProductId] = useState(route.params.product_id ?? '');
  const [warehouses, setWarehouses] = useState<SelectOption[]>([]);
  const debounced = useDebouncedValue(query);

  useEffect(() => {
    if (presetKey === 'balances' || presetKey === 'movements') {
      void warehousesAPI.list({ per_page: 100 }).then((res) => {
        const list = extractArray<Record<string, unknown>>(res);
        setWarehouses([{ label: 'كل المخازن', value: '' }, ...list.map((w) => ({ label: String(w.name), value: String(w.id) }))]);
      });
    }
  }, [presetKey]);

  const loader = useCallback(
    (params: ListParams) => get(preset.endpoint, params) as Promise<ApiEnvelope<Record<string, unknown>[]>>,
    [preset.endpoint],
  );

  const listParams = useMemo(
    () => ({
      ...preset.defaultParams,
      per_page: 50,
      ...(warehouseId ? { warehouse_id: warehouseId } : filterWarehouseId ? { warehouse_id: filterWarehouseId } : {}),
      ...(filterProductId ? { product_id: Number(filterProductId) } : {}),
      [preset.searchParam ?? 'search']: debounced || undefined,
    }),
    [debounced, preset.defaultParams, preset.searchParam, warehouseId, filterWarehouseId, filterProductId],
  );

  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Record<string, unknown>>(
    loader,
    listParams,
  );

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const lowQty = useMemo(() => items.filter((r) => Number(r.quantity ?? 0) <= 0).length, [items]);

  const stats = useMemo(() => {
    if (presetKey === 'balances') {
      return [
        { label: 'سجل', value: items.length },
        { label: 'نفد', value: lowQty, tone: 'danger' as const },
      ];
    }
    if (presetKey === 'expiry') {
      const expired = items.filter((r) => r.status === 'expired').length;
      return [
        { label: 'تنبيه', value: items.length },
        { label: 'منتهي', value: expired, tone: 'danger' as const },
      ];
    }
    return [{ label: 'العناصر', value: items.length }];
  }, [items, lowQty, presetKey]);

  const listHeader = (
    <View style={cs.pageHeader}>
      <InventoryHero
        eyebrow={preset.eyebrow}
        title={warehouseName ? `${preset.title} — ${warehouseName}` : preset.title}
        subtitle={
          warehouseName
            ? `أرصدة مخزن «${warehouseName}» فقط.`
            : preset.subtitle
        }
        stats={stats}
        metaLabel={`${items.length} عنصر`}
        isLoading={loading || refreshing}
        onRefresh={() => void refresh()}
      />
      <View style={cs.searchWrap}>
        <MaterialIcons name="search" size={22} color={c.textCaption} />
        <View style={cs.searchInput}>
          <AppInput value={query} onChangeText={setQuery} placeholder="بحث..." />
        </View>
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <MaterialIcons name="close" size={20} color={c.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {(presetKey === 'balances' || presetKey === 'movements') && warehouses.length > 1 ? (
        <AppSelect label="المستودع" value={filterWarehouseId || null} options={warehouses} onChange={(v) => setFilterWarehouseId(v ?? '')} />
      ) : null}
      {presetKey === 'balances' ? (
        <AppInput label="معرف منتج (اختياري)" value={filterProductId} onChangeText={setFilterProductId} keyboardType="number-pad" placeholder="رقم المنتج" />
      ) : null}
      <Text style={cs.sectionLabel}>{items.length} نتيجة</Text>
    </View>
  );

  const openItem = (item: Record<string, unknown>) => {
    if (presetKey === 'balances') {
      navigation.navigate('StockBalanceDetail', {
        product_id: Number(item.product_id ?? (item.product as Record<string, unknown>)?.id),
        warehouse_id: String(item.warehouse_id ?? filterWarehouseId ?? warehouseId ?? ''),
        product_name: String(item.product_name ?? (item.product as Record<string, unknown>)?.name ?? ''),
      });
      return;
    }
    if (presetKey === 'movements') {
      navigation.navigate('InventoryMovementDetail', { movement: item });
      return;
    }
    if (presetKey === 'stockCounts') {
      navigation.navigate('StockCountDetail', { id: String(item.id) });
      return;
    }
    if (presetKey === 'requisitions') {
      navigation.navigate('RequisitionDetail', { id: String(item.id) });
      return;
    }
    if (presetKey === 'reorderRules') {
      navigation.navigate('ReorderRuleForm', { id: Number(item.id) });
    }
  };

  return (
    <AppScreen title={preset.title} onBack={navigation.goBack} scroll={false} contentStyle={{ padding: 0, gap: 0 }}>
      {loading && items.length === 0 ? (
        <AppLoadingState />
      ) : error && items.length === 0 ? (
        <AppErrorState message={error} onRetry={() => void refresh()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${presetKey}-${String(item.id ?? index)}-${index}`}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[cs.listContent, { paddingBottom: tabBarInset }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={c.accent} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={
            <AppEmptyState title={preset.emptyTitle} message={preset.emptyMessage} />
          }
          renderItem={({ item }) => {
            const model = mapInventoryRow(presetKey, item);
            return <InventoryListCard {...model} icon={PRESET_ICONS[presetKey]} onPress={() => openItem(item)} />;
          }}
        />
      )}
    </AppScreen>
  );
}
