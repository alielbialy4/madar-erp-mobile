import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { inventoryAPI, warehousesAPI } from '@/api/inventory';
import { AppScreen, ModuleHeader } from '@/components/layout';
import { HeroActionChip } from '@/components/layout/HeroActionChip';
import { InventoryListCard } from '@/components/inventory/InventoryListCard';
import { InventoryScopeBanner } from '@/components/inventory/InventoryScopeBanner';
import { mapInventoryRow } from '@/components/inventory/inventoryRowUtils';
import { WarehouseListCard } from '@/components/inventory/WarehouseListCard';
import { createInventoryUiStyles } from '@/components/inventory/inventoryUiStyles';
import { useInventoryScope } from '@/hooks/useInventoryScope';
import type { Warehouse } from '@/types/api';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import type { InventoryListPresetKey, MoreStackParamList } from '@/types/navigation';
import { Text } from '@/components/ui/AppText';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'Inventory'>;

type HubScreen =
  | 'ReorderRulesList'
  | 'RequisitionsList'
  | 'StockCountsList'
  | 'StockAdjustmentsList'
  | 'StockTransfersList'
  | 'InventoryProducts';

type HubLink =
  | { preset: InventoryListPresetKey; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }
  | { screen: HubScreen; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] };

const HUB_LINKS: HubLink[] = [
  { screen: 'InventoryProducts', label: 'منتجات المخزون', icon: 'category' },
  { preset: 'balances', label: 'أرصدة المخزون', icon: 'inventory-2' },
  { preset: 'movements', label: 'حركات المخزون', icon: 'sync-alt' },
  { preset: 'expiry', label: 'تنبيهات الصلاحية', icon: 'event-busy' },
  { screen: 'ReorderRulesList', label: 'قواعد إعادة الطلب', icon: 'rule' },
  { screen: 'RequisitionsList', label: 'طلبات داخلية', icon: 'assignment' },
  { screen: 'StockCountsList', label: 'جرد المخزون', icon: 'fact-check' },
  { screen: 'StockAdjustmentsList', label: 'سجل التسويات', icon: 'edit' },
  { screen: 'StockTransfersList', label: 'سجل التحويلات', icon: 'swap-horiz' },
];

export function InventoryScreen({ navigation }: { navigation: Nav }) {
  const c = useColors();
  const cs = useMemo(() => createCategoryStyles(c), [c]);
  const ui = useMemo(() => createInventoryUiStyles(c), [c]);
  const { canManageDirectory } = useInventoryScope();
  const [balances, setBalances] = useState<Record<string, unknown>[]>([]);
  const [expiry, setExpiry] = useState<Record<string, unknown>[]>([]);
  const [warehouses, setWarehouses] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [balancesRes, expiryRes, warehousesRes] = await Promise.all([
        inventoryAPI.balances({ per_page: 8 }),
        inventoryAPI.expiryStock({ per_page: 6, near_expiry_only: true }),
        warehousesAPI.list({ per_page: 50 }),
      ]);
      setBalances(extractArray(balancesRes));
      setExpiry(extractArray(expiryRes));
      setWarehouses(extractArray(warehousesRes));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const outCount = balances.filter((r) => Number(r.quantity ?? 0) <= 0).length;

  const goList = (preset: InventoryListPresetKey) => navigation.navigate('InventoryList', { preset });

  const openHubLink = (link: HubLink) => {
    if ('screen' in link) {
      navigation.navigate(link.screen);
      return;
    }
    goList(link.preset);
  };

  const hubLinkKey = (link: HubLink) => ('screen' in link ? link.screen : link.preset);

  return (
    <AppScreen title="المخزون" onBack={navigation.goBack} scroll onRefresh={() => void load()} refreshing={loading}>
      <View style={{ gap: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          <InventoryScopeBanner />
          <ModuleHeader
            eyebrow="المخزون"
            title="مركز تشغيل المخزون"
            subtitle="راقب الرصيد والصلاحية، ثم انتقل مباشرة إلى حركة المخزون المطلوبة."
            stats={[
              { label: 'مخازن', value: warehouses.length },
              { label: 'أرصدة', value: balances.length },
              { label: 'نفد', value: outCount, tone: 'danger' },
              { label: 'صلاحية', value: expiry.length, tone: 'warning' },
            ]}
            onRefresh={() => void load()}
            refreshing={loading}
            compact
            actions={(
              <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm, width: '100%' }}>
                <HeroActionChip label="المخازن" icon="warehouse" fill onPress={() => navigation.navigate('Warehouses')} />
                <HeroActionChip label="تسوية" icon="edit" variant="primary" fill onPress={() => navigation.navigate('StockAdjustment')} />
                <HeroActionChip label="تحويل" icon="swap-horiz" fill onPress={() => navigation.navigate('StockTransfer')} />
              </View>
            )}
          />
        </View>

        {loading && balances.length === 0 && warehouses.length === 0 ? <AppLoadingState variant="skeleton" skeletonRows={4} /> : null}
        {error ? <AppErrorState message={error} onRetry={() => void load()} /> : null}

        {!error ? (
          <>
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
              <Text style={cs.sectionLabel}>الأقسام</Text>
              <View style={ui.chipsWrap}>
                {HUB_LINKS.map((link) => (
                  <Pressable
                    key={hubLinkKey(link)}
                    onPress={() => openHubLink(link)}
                    style={[cs.filterPill, ui.filterPillWithIcon]}
                  >
                    <MaterialIcons name={link.icon} size={16} color={c.accent} />
                    <Text style={[cs.filterText, { color: c.text }]}>{link.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
              <View style={ui.sectionHeaderRow}>
                <Text style={cs.sectionLabel}>المخازن</Text>
                <Pressable onPress={() => navigation.navigate('Warehouses')}>
                  <Text style={ui.linkAction}>إدارة المخازن</Text>
                </Pressable>
              </View>
              {warehouses.length === 0 ? (
                <AppEmptyState title="لا توجد مخازن" />
              ) : (
                warehouses.slice(0, 4).map((row, index) => (
                  <WarehouseListCard
                    key={`wh-${index}`}
                    warehouse={row as Warehouse}
                    canManage={canManageDirectory}
                    variant="compact"
                    onPress={() => navigation.navigate('WarehouseDetail', { id: String(row.id), name: String(row.name) })}
                    onEdit={
                      canManageDirectory
                        ? () => navigation.navigate('WarehouseForm', { id: String(row.id) })
                        : undefined
                    }
                  />
                ))
              )}
            </View>

            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
              <View style={ui.sectionHeaderRow}>
                <Text style={cs.sectionLabel}>أرصدة حديثة</Text>
                <Pressable onPress={() => goList('balances')}>
                  <Text style={ui.linkAction}>عرض الكل</Text>
                </Pressable>
              </View>
              {balances.length === 0 ? (
                <AppEmptyState title="لا توجد أرصدة" />
              ) : (
                balances.map((row, index) => {
                  const model = mapInventoryRow('balances', row);
                  return (
                    <InventoryListCard
                      key={`bal-${index}`}
                      {...model}
                      icon="inventory-2"
                      variant="compact"
                      onPress={() =>
                        navigation.navigate('StockBalanceDetail', {
                          product_id: Number(row.product_id ?? (row.product as Record<string, unknown>)?.id),
                          warehouse_id: String(row.warehouse_id ?? ''),
                          product_name: String(row.product_name ?? (row.product as Record<string, unknown>)?.name ?? ''),
                        })
                      }
                    />
                  );
                })
              )}
            </View>

            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
              <View style={ui.sectionHeaderRow}>
                <Text style={cs.sectionLabel}>تنبيهات الصلاحية</Text>
                <Pressable onPress={() => goList('expiry')}>
                  <Text style={ui.linkAction}>عرض الكل</Text>
                </Pressable>
              </View>
              {expiry.length === 0 ? (
                <AppEmptyState title="لا توجد تنبيهات صلاحية" />
              ) : (
                expiry.map((row, index) => {
                  const model = mapInventoryRow('expiry', row);
                  return (
                    <InventoryListCard
                      key={`exp-${index}`}
                      {...model}
                      icon="event-busy"
                      variant="compact"
                      onPress={() =>
                        navigation.navigate('StockBalanceDetail', {
                          product_id: Number(row.product_id ?? (row.product as Record<string, unknown>)?.id),
                          warehouse_id: String(row.warehouse_id ?? ''),
                          product_name: String(row.product_name ?? (row.product as Record<string, unknown>)?.name ?? ''),
                        })
                      }
                    />
                  );
                })
              )}
            </View>
          </>
        ) : null}
      </View>
    </AppScreen>
  );
}
