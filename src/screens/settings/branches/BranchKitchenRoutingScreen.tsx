import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  kitchenRoutingAPI,
  type KitchenRoutingCategoryRow,
  type KitchenRoutingProductRow,
  type KitchenRoutingSnapshot,
  type KitchenRoutingType,
  type UpdateRoutingPayload,
} from '@/api/kitchenRouting';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { ListScreenLayout } from '@/components/layout';
import {
  AppButton,
  AppCard,
  AppChip,
  AppSearchField,
  AppSelect,
} from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppErrorState, AppInlineAlert, AppLoadingState, useToast } from '@/components/feedback';
import {
  getServerPrinterMap,
  mapServerPrinterToLocal,
} from '@/services/printing/branchPrintBinding';
import { getPrinterProfilesStrict } from '@/services/printing/printerProfiles';
import { invalidateKitchenRoutingCache } from '@/services/printing/kitchenRoutingResolver';
import { useBranchPrintSummary } from '@/hooks/useBranchPrintSummary';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { flexRow, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { PrinterProfile } from '@/types/printing';
import type { SelectOption } from '@/components/ui/AppSelect';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<MoreStackParamList, 'BranchKitchenRouting'>;

type Tab = 'categories' | 'products' | 'devices';
type RowTarget =
  | { kind: 'category'; row: KitchenRoutingCategoryRow }
  | { kind: 'product'; row: KitchenRoutingProductRow };

const PAGE_SIZE = 25;

const ROUTING_OPTS: SelectOption[] = [
  { label: 'شاشة مطبخ', value: 'screen' },
  { label: 'طابعة', value: 'printer' },
  { label: 'لا شيء', value: 'none' },
];

const PRODUCT_ROUTING_OPTS: SelectOption[] = [
  { label: 'يرث من التصنيف', value: 'inherit' },
  ...ROUTING_OPTS,
];

function routingLabel(type: KitchenRoutingType | null | 'inherit'): string {
  if (type === 'screen') return 'شاشة';
  if (type === 'printer') return 'طابعة';
  if (type === 'inherit') return 'يرث';
  return 'لا شيء';
}

export function BranchKitchenRoutingScreen({ navigation, route }: Props) {
  const branchId = String(route.params?.branchId ?? '');
  const c = useColors();
  const toast = useToast();
  const printSummary = useBranchPrintSummary(branchId);

  const [tab, setTab] = useState<Tab>('categories');
  const [snapshot, setSnapshot] = useState<KitchenRoutingSnapshot | null>(null);
  const [localProfiles, setLocalProfiles] = useState<PrinterProfile[]>([]);
  const [serverMap, setServerMap] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<RowTarget | null>(null);
  const [editType, setEditType] = useState<string>('none');
  const [editStationId, setEditStationId] = useState<string>('');
  const [editPrinterId, setEditPrinterId] = useState<string>('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState<'category' | 'product' | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      const [snap, profiles, map] = await Promise.all([
        kitchenRoutingAPI.branchSnapshot(branchId, {
          q: search.trim() || undefined,
          page: tab === 'products' ? page : 1,
          per_page: PAGE_SIZE,
        }),
        getPrinterProfilesStrict(branchId),
        getServerPrinterMap(branchId),
      ]);
      setSnapshot(snap);
      setLocalProfiles(profiles.filter((p) => p.role === 'kitchen' || p.role === 'bar'));
      setServerMap(map);
      invalidateKitchenRoutingCache(branchId);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [branchId, page, search, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
    setSelectedProductIds([]);
  }, [search]);

  const stations = snapshot?.stations ?? [];
  const printers = snapshot?.printers ?? [];
  const summary = snapshot?.routing_summary;

  const stationOptions: SelectOption[] = useMemo(
    () => [
      { label: '— بدون محطة —', value: '' },
      ...stations.filter((s) => s.is_active).map((s) => ({ label: s.name, value: s.id })),
    ],
    [stations],
  );

  const printerOptions: SelectOption[] = useMemo(
    () => [
      { label: '— اختر طابعة سيرفر —', value: '' },
      ...printers.filter((p) => p.is_active).map((p) => ({ label: p.name, value: p.id })),
    ],
    [printers],
  );

  const localProfileOptions: SelectOption[] = useMemo(
    () => [
      { label: '— اختر طابعة محلية —', value: '' },
      ...localProfiles.map((p) => ({ label: `${p.name} (${p.role})`, value: p.id })),
    ],
    [localProfiles],
  );

  const openEdit = (target: RowTarget) => {
    const row = target.row;
    const type =
      target.kind === 'product' && row.kitchen_routing_type == null
        ? 'inherit'
        : row.kitchen_routing_type ?? 'none';
    setEditing(target);
    setEditType(type);
    setEditStationId(row.kitchen_station_id ?? '');
    setEditPrinterId(row.kitchen_printer_id ?? '');
  };

  const closeEdit = () => {
    setEditing(null);
    setBulkOpen(null);
  };

  const buildPayload = (): UpdateRoutingPayload => ({
    routing_type: editType as KitchenRoutingType | 'inherit',
    kitchen_station_id: editType === 'screen' && editStationId ? editStationId : null,
    kitchen_printer_id: editType === 'printer' && editPrinterId ? editPrinterId : null,
  });

  const saveEdit = async () => {
    if (!editing || !branchId) return;
    if (editType === 'printer' && !editPrinterId) {
      toast.error('اختر طابعة مطبخ من السيرفر');
      return;
    }
    if (editType === 'screen' && !editStationId) {
      toast.error('اختر محطة مطبخ');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing.kind === 'category') {
        await kitchenRoutingAPI.updateCategoryRouting(branchId, editing.row.id, payload);
      } else {
        await kitchenRoutingAPI.updateProductRouting(branchId, editing.row.id, payload);
      }
      toast.success('تم حفظ التوجيه');
      closeEdit();
      void load();
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const saveBulk = async () => {
    if (!bulkOpen || !branchId) return;
    const ids = bulkOpen === 'category' ? selectedCategoryIds : selectedProductIds;
    if (ids.length === 0) {
      toast.error('اختر عناصر أولاً');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (bulkOpen === 'category') {
        await kitchenRoutingAPI.bulkUpdateCategoryRouting(branchId, ids, payload);
        setSelectedCategoryIds([]);
      } else {
        await kitchenRoutingAPI.bulkUpdateProductRouting(branchId, ids, payload);
        setSelectedProductIds([]);
      }
      toast.success(`تم تحديث ${ids.length} عنصر`);
      closeEdit();
      void load();
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : ids.concat(id),
    );
  };

  const toggleProduct = (id: number) => {
    setSelectedProductIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : ids.concat(id),
    );
  };

  const onMapPrinter = async (serverPrinterId: string, localId: string) => {
    await mapServerPrinterToLocal(branchId, serverPrinterId, localId || null);
    setServerMap(await getServerPrinterMap(branchId));
    toast.success('تم ربط الطابعة');
  };

  const productPage = snapshot?.products;
  const showNoRouting =
    !loading && summary && !summary.has_any_routing;
  const showNoScreen =
    !loading && summary && summary.has_any_routing && !summary.has_screen_routing;
  const showPrinterGap =
    !loading &&
    summary &&
    printers.some((p) => p.is_active) &&
    !summary.has_printer_routing;

  if (!branchId) {
    return (
      <ListScreenLayout title="توجيه المطبخ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف الفرع مطلوب" />
      </ListScreenLayout>
    );
  }

  return (
    <ListScreenLayout
      title="توجيه المطبخ"
      subtitle={snapshot?.branch.name ?? branchId}
      onBack={navigation.goBack}
      onRefresh={() => void load()}
      refreshing={loading}
      hero={{
        eyebrow: 'الفرع',
        title: 'توجيه المطبخ',
        subtitle: 'تصنيفات · منتجات · ربط الأجهزة',
        compact: true,
      }}
    >
      {loading && !snapshot ? <AppLoadingState message="جاري التحميل…" /> : null}
      {error ? <AppErrorState message={error} onRetry={() => void load()} /> : null}

      {snapshot ? (
        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
          {printSummary.useServerKitchenQueue ? (
            <AppInlineAlert
              tone="warning"
              message="طابور طباعة السيرفر مفعّل — الموبايل يتخطى الطباعة المحلية. عطّله من إعدادات الإيصال لاستخدام IP."
            />
          ) : null}
          {showNoRouting ? (
            <AppInlineAlert tone="warning" message="لا يوجد أي توجيه مطبخ مفعّل لهذا الفرع." />
          ) : null}
          {showNoScreen ? (
            <AppInlineAlert tone="info" message="لا توجد أصناف موجّهة لشاشة المطبخ." />
          ) : null}
          {showPrinterGap ? (
            <AppInlineAlert tone="warning" message="توجد طابعات نشطة لكن لا أصناف موجّهة للطباعة." />
          ) : null}

          <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.xs }}>
            {(
              [
                { id: 'categories' as Tab, label: 'التصنيفات' },
                { id: 'products' as Tab, label: 'المنتجات' },
                { id: 'devices' as Tab, label: 'ربط الأجهزة' },
              ] as const
            ).map((t) => (
              <AppChip
                key={t.id}
                label={t.label}
                active={tab === t.id}
                onPress={() => setTab(t.id)}
              />
            ))}
          </View>

          {tab === 'devices' ? (
            <>
              <Text style={{ ...textStart, color: c.textMuted }}>
                اربط طابعات السيرفر بملفات الطابعات على هذا الجهاز:
              </Text>
              {(printers ?? []).map((sp) => (
                <AppSelect
                  key={sp.id}
                  label={`${sp.name} (سيرفر)`}
                  value={serverMap[sp.id] ?? ''}
                  options={localProfileOptions}
                  onChange={(v) => void onMapPrinter(sp.id, v)}
                />
              ))}
              <AppButton
                title="إدارة طابعات السيرفر"
                variant="secondary"
                onPress={() => navigation.navigate('BranchKitchenPrinters', { branchId })}
              />
            </>
          ) : null}

          {tab === 'categories' ? (
            <>
              {selectedCategoryIds.length > 0 ? (
                <AppButton
                  title={`تعديل جماعي (${selectedCategoryIds.length})`}
                  onPress={() => {
                    setBulkOpen('category');
                    setEditType('none');
                    setEditStationId('');
                    setEditPrinterId('');
                  }}
                />
              ) : null}
              {snapshot.categories.map((cat) => {
                const selected = selectedCategoryIds.includes(cat.id);
                return (
                  <Pressable key={cat.id} onPress={() => openEdit({ kind: 'category', row: cat })}>
                    <AppCard>
                      <View style={{ ...flexRow, alignItems: 'center', gap: spacing.sm }}>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation?.();
                            toggleCategory(cat.id);
                          }}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            borderWidth: 2,
                            borderColor: selected ? c.primary : c.border,
                            backgroundColor: selected ? c.primary : 'transparent',
                          }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={{ ...textStart, fontWeight: '600', color: c.text }}>
                            {cat.name_ar ?? cat.name}
                          </Text>
                          <Text style={{ ...textStart, color: c.textMuted, fontSize: 12 }}>
                            {routingLabel(cat.kitchen_routing_type)}
                          </Text>
                        </View>
                      </View>
                    </AppCard>
                  </Pressable>
                );
              })}
            </>
          ) : null}

          {tab === 'products' ? (
            <>
              <AppSearchField
                value={search}
                onChangeText={setSearch}
                placeholder="بحث منتج…"
              />
              {selectedProductIds.length > 0 ? (
                <AppButton
                  title={`تعديل جماعي (${selectedProductIds.length})`}
                  onPress={() => {
                    setBulkOpen('product');
                    setEditType('inherit');
                    setEditStationId('');
                    setEditPrinterId('');
                  }}
                />
              ) : null}
              {(productPage?.data ?? []).map((prod) => {
                const selected = selectedProductIds.includes(prod.id);
                const type =
                  prod.kitchen_routing_type == null ? 'inherit' : prod.kitchen_routing_type;
                return (
                  <Pressable key={prod.id} onPress={() => openEdit({ kind: 'product', row: prod })}>
                    <AppCard>
                      <View style={{ ...flexRow, alignItems: 'center', gap: spacing.sm }}>
                        <Pressable
                          onPress={() => toggleProduct(prod.id)}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            borderWidth: 2,
                            borderColor: selected ? c.primary : c.border,
                            backgroundColor: selected ? c.primary : 'transparent',
                          }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={{ ...textStart, fontWeight: '600', color: c.text }}>
                            {prod.name}
                          </Text>
                          <Text style={{ ...textStart, color: c.textMuted, fontSize: 12 }}>
                            {routingLabel(type)}
                          </Text>
                        </View>
                      </View>
                    </AppCard>
                  </Pressable>
                );
              })}
              {productPage && productPage.last_page > 1 ? (
                <View style={{ ...flexRow, gap: spacing.sm, justifyContent: 'center' }}>
                  <AppButton
                    title="السابق"
                    variant="secondary"
                    disabled={page <= 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                  />
                  <Text style={{ alignSelf: 'center', color: c.textMuted }}>
                    {page} / {productPage.last_page}
                  </Text>
                  <AppButton
                    title="التالي"
                    variant="secondary"
                    disabled={page >= productPage.last_page}
                    onPress={() => setPage((p) => p + 1)}
                  />
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      ) : null}

      <AppBottomSheet
        visible={Boolean(editing || bulkOpen)}
        onClose={closeEdit}
        title={bulkOpen ? 'تعديل جماعي للوجهة' : 'وجهة التوجيه'}
      >
        <View style={{ gap: spacing.md, paddingBottom: spacing.lg }}>
          <AppSelect
            label="نوع التوجيه"
            value={editType}
            options={bulkOpen === 'product' || editing?.kind === 'product' ? PRODUCT_ROUTING_OPTS : ROUTING_OPTS}
            onChange={setEditType}
          />
          {editType === 'screen' ? (
            <AppSelect
              label="محطة المطبخ"
              value={editStationId}
              options={stationOptions}
              onChange={setEditStationId}
            />
          ) : null}
          {editType === 'printer' ? (
            <AppSelect
              label="طابعة المطبخ (سيرفر)"
              value={editPrinterId}
              options={printerOptions}
              onChange={setEditPrinterId}
            />
          ) : null}
          <AppButton
            title="حفظ"
            loading={saving}
            onPress={() => void (bulkOpen ? saveBulk() : saveEdit())}
          />
        </View>
      </AppBottomSheet>
    </ListScreenLayout>
  );
}
