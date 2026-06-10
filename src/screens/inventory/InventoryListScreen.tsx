import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { get } from '@/api/client';
import { InventoryHero } from '@/components/inventory/InventoryHero';
import { InventoryListShell } from '@/components/inventory/InventoryListShell';
import { INVENTORY_LIST_PRESETS, getPresetSearchParam } from '@/components/inventory/inventoryListPresets';
import type { ApiEnvelope, ListParams } from '@/types/api';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'InventoryList'>;
type Route = RouteProp<MoreStackParamList, 'InventoryList'>;

export function InventoryListScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const presetKey = route.params.preset;
  const warehouseId = route.params.warehouse_id;
  const warehouseName = route.params.warehouse_name;
  const preset = INVENTORY_LIST_PRESETS[presetKey];
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;

  const [listItems, setListItems] = useState<Record<string, unknown>[]>([]);
  const [refreshingHero, setRefreshingHero] = useState(false);
  const [shellKey, setShellKey] = useState(0);

  useEffect(() => {
    if (presetKey === 'warehouses') {
      navigation.replace('Warehouses');
    }
  }, [navigation, presetKey]);

  const loader = useCallback(
    (params: ListParams) => get(preset.endpoint, params) as Promise<ApiEnvelope<Record<string, unknown>[]>>,
    [preset.endpoint],
  );

  const lowQty = useMemo(() => listItems.filter((r) => Number(r.quantity ?? 0) <= 0).length, [listItems]);

  const stats = useMemo(() => {
    if (presetKey === 'balances') {
      return [
        { label: 'سجل', value: listItems.length },
        { label: 'نفد', value: lowQty, tone: 'danger' as const },
      ];
    }
    if (presetKey === 'expiry') {
      const expired = listItems.filter((r) => r.status === 'expired').length;
      return [
        { label: 'تنبيه', value: listItems.length },
        { label: 'منتهي', value: expired, tone: 'danger' as const },
      ];
    }
    return [{ label: 'العناصر', value: listItems.length }];
  }, [listItems, lowQty, presetKey]);

  const openItem = useCallback(
    (item: Record<string, unknown>) => {
      if (presetKey === 'balances' || presetKey === 'expiry') {
        navigation.navigate('StockBalanceDetail', {
          product_id: Number(item.product_id ?? (item.product as Record<string, unknown>)?.id),
          warehouse_id: String(item.warehouse_id ?? warehouseId ?? ''),
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
    },
    [navigation, presetKey, warehouseId],
  );

  const hero = (
    <InventoryHero
      eyebrow={preset.eyebrow}
      title={warehouseName ? `${preset.title} — ${warehouseName}` : preset.title}
      subtitle={
        warehouseName ? `أرصدة مخزن «${warehouseName}» فقط.` : preset.subtitle
      }
      stats={stats}
      metaLabel={`${listItems.length} عنصر`}
      isLoading={refreshingHero}
      onRefresh={() => {
        setRefreshingHero(true);
        setShellKey((k) => k + 1);
        setTimeout(() => setRefreshingHero(false), 400);
      }}
      statsOnly={!isTablet}
      compact
    />
  );

  if (presetKey === 'warehouses') return null;

  return (
    <InventoryListShell
      key={`${presetKey}-${shellKey}`}
      title={preset.title}
      onBack={navigation.goBack}
      surface={preset.surface}
      loader={loader}
      searchParam={getPresetSearchParam(presetKey)}
      searchEnabled={preset.supportsSearch !== false}
      searchPlaceholder="بحث..."
      supportedFilters={preset.supportedFilters ?? []}
      defaultParams={preset.defaultParams}
      fixedParams={warehouseId ? { warehouse_id: warehouseId } : undefined}
      lockedWarehouseId={warehouseId}
      warehouseName={warehouseName}
      listHeader={hero}
      emptyTitle={preset.emptyTitle}
      emptyMessage={preset.emptyMessage}
      onItemsChange={setListItems}
      layout="table"
      onItemPress={openItem}
    />
  );
}
