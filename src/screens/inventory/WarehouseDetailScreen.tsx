import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { warehousesAPI } from '@/api/inventory';
import { AppScreen } from '@/components/layout';
import { InventoryHero } from '@/components/inventory/InventoryHero';
import { InventoryListCard } from '@/components/inventory/InventoryListCard';
import { DetailInfoCard } from '@/components/products/DetailInfoCard';
import { ProductInsightBlock } from '@/components/products/ProductInsightBlock';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { AppErrorState, AppLoadingState, ConfirmDialog } from '@/components/feedback';
import { useInventoryDirectoryAccess } from '@/hooks/useInventoryDirectoryAccess';
import { useColors } from '@/hooks/useColors';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { numberText } from '@/utils/format';
import { mapInventoryRow } from '@/components/inventory/inventoryRowUtils';
import type { Warehouse } from '@/types/api';
import type { MoreStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'WarehouseDetail'>;
type Route = RouteProp<MoreStackParamList, 'WarehouseDetail'>;

export function WarehouseDetailScreen({ route, navigation }: { route: Route; navigation: Nav }) {
  const c = useColors();
  const cs = useMemo(() => createCategoryStyles(c), [c]);
  const { canManage } = useInventoryDirectoryAccess();
  const id = route.params.id;

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await warehousesAPI.get(id, { include_balances: true, balances_limit: 100 });
      setWarehouse(extractData<Warehouse>(res) ?? null);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async () => {
    setDeleting(true);
    try {
      await warehousesAPI.delete(id);
      navigation.goBack();
    } catch {
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !warehouse) {
    return (
      <AppScreen title="تفاصيل المخزن" onBack={navigation.goBack}>
        <AppLoadingState />
      </AppScreen>
    );
  }

  if (error && !warehouse) {
    return (
      <AppScreen title="تفاصيل المخزن" onBack={navigation.goBack}>
        <AppErrorState message={error} onRetry={() => void load()} />
      </AppScreen>
    );
  }

  if (!warehouse) {
    return (
      <AppScreen title="تفاصيل المخزن" onBack={navigation.goBack}>
        <AppErrorState message="المخزن غير موجود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }

  const isActive = warehouse.status !== 'inactive';
  const balances = warehouse.balances ?? [];

  return (
    <>
      <AppScreen title="تفاصيل المخزن" onBack={navigation.goBack} scroll contentStyle={{ padding: 0 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <View style={[cs.pageHeader, { paddingBottom: 0 }]}>
            <InventoryHero
              eyebrow="المخزن"
              title={warehouse.name}
              subtitle={warehouse.location ?? 'بدون موقع محدد'}
              stats={[
                { label: 'أصناف', value: numberText(warehouse.products_count ?? balances.length) },
                { label: 'الحالة', value: isActive ? 'نشط' : 'غير نشط', tone: isActive ? 'success' : 'warning' },
              ]}
              chips={[
                {
                  label: 'كل الأرصدة',
                  icon: 'inventory-2',
                  onPress: () =>
                    navigation.navigate('InventoryList', {
                      preset: 'balances',
                      warehouse_id: id,
                      warehouse_name: warehouse.name,
                    }),
                },
                ...(canManage
                  ? [
                      {
                        label: 'تعديل',
                        icon: 'edit' as const,
                        onPress: () => navigation.navigate('WarehouseForm', { id }),
                        primary: true,
                      },
                      {
                        label: 'حذف',
                        icon: 'delete-outline' as const,
                        onPress: () => setDeleteOpen(true),
                      },
                    ]
                  : []),
              ]}
              onRefresh={() => void load()}
              isLoading={loading}
            />
          </View>

          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.md }}>
            <DetailInfoCard
              title="بيانات المخزن"
              icon="warehouse"
              fields={[
                { label: 'الاسم', value: warehouse.name },
                { label: 'الكود', value: warehouse.code ?? '—', ltr: Boolean(warehouse.code) },
                { label: 'الموقع', value: warehouse.location ?? '—' },
                { label: 'الفرع', value: warehouse.branch?.name ?? 'غير مرتبط' },
                { label: 'الحالة', value: isActive ? 'نشط' : 'غير نشط' },
              ]}
            />

            <ProductInsightBlock
              title="أصناف بالمخزن"
              icon="inventory-2"
              emptyMessage="لا توجد أرصدة موجبة في هذا المخزن"
              rows={balances.map((row, index) => {
                const mapped = mapInventoryRow('balances', row as Record<string, unknown>);
                return {
                  key: String(row.id ?? index),
                  label: mapped.title,
                  value: mapped.meta ?? numberText(row.quantity ?? 0),
                };
              })}
            />

            {balances.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                {balances.slice(0, 12).map((row, index) => {
                  const model = mapInventoryRow('balances', row as Record<string, unknown>);
                  return <InventoryListCard key={String(row.id ?? index)} {...model} icon="inventory-2" />;
                })}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </AppScreen>

      <ConfirmDialog
        visible={deleteOpen}
        title="حذف المخزن"
        message={`هل أنت متأكد من حذف «${warehouse.name}»؟`}
        loading={deleting}
        onConfirm={() => void remove()}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
