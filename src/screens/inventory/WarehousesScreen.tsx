import React, { useCallback, useMemo, useState } from 'react';
import { Alert, useWindowDimensions } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { warehousesAPI } from '@/api/inventory';
import { WarehousesHero } from '@/components/inventory/WarehousesHero';
import { InventoryListShell } from '@/components/inventory/InventoryListShell';
import { ConfirmDialog } from '@/components/feedback';
import { useInventoryScope } from '@/hooks/useInventoryScope';
import { warehouseListStats } from '@/constants/inventoryLayout';
import { INVENTORY_LIST_PRESETS } from '@/components/inventory/inventoryListPresets';
import { normalizeApiError } from '@/utils/errors';
import type { Warehouse } from '@/types/api';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'Warehouses'>;

const preset = INVENTORY_LIST_PRESETS.warehouses;

export function WarehousesScreen({ navigation }: { navigation: Nav }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const { canManageDirectory, directoryReadOnlyHint } = useInventoryScope();
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [listItems, setListItems] = useState<(Warehouse & Record<string, unknown>)[]>([]);
  const [refreshingHero, setRefreshingHero] = useState(false);
  const [shellRefreshKey, setShellRefreshKey] = useState(0);

  const stats = useMemo(() => warehouseListStats(listItems), [listItems]);

  const navigateDetail = useCallback(
    (item: Warehouse) => {
      navigation.navigate('WarehouseDetail', { id: item.id, name: item.name });
    },
    [navigation],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await warehousesAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      setShellRefreshKey((k) => k + 1);
    } catch (err) {
      setDeleteTarget(null);
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const hero = (
    <WarehousesHero
      totalCount={stats.total}
      activeCount={stats.active}
      inactiveCount={stats.inactive}
      productsTotal={stats.productsTotal}
      isLoading={refreshingHero}
      onRefresh={() => {
        setRefreshingHero(true);
        setShellRefreshKey((k) => k + 1);
        setTimeout(() => setRefreshingHero(false), 400);
      }}
      canManage={canManageDirectory}
      onAdd={canManageDirectory ? () => navigation.navigate('WarehouseForm', {}) : undefined}
      readOnlyHint={directoryReadOnlyHint}
      statsOnly={!isTablet}
      showActions={Boolean(canManageDirectory && !isTablet)}
      compact
    />
  );

  return (
    <>
      <InventoryListShell
        key={`warehouses-${shellRefreshKey}`}
        title="المخازن"
        onBack={navigation.goBack}
        surface="warehouses"
        loader={warehousesAPI.list}
        searchParam="search"
        searchPlaceholder="بحث بالاسم أو الكود..."
        supportedFilters={preset.supportedFilters ?? []}
        listHeader={hero}
        canManage={canManageDirectory}
        onAdd={canManageDirectory ? () => navigation.navigate('WarehouseForm', {}) : undefined}
        emptyTitle={preset.emptyTitle}
        emptyMessage={canManageDirectory ? 'أنشئ أول مخزن لتنظيم الأرصدة والتحويلات' : preset.emptyMessage}
        scopeBannerVariant="directory"
        onItemsChange={setListItems}
        layout="table"
        onItemPress={(item) => navigateDetail(item as Warehouse)}
      />
      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="حذف المخزن"
        message={`هل تريد حذف «${deleteTarget?.name ?? ''}»؟ لا يمكن الحذف إذا كان هناك رصيد.`}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
