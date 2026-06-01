import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBottomSheet } from '@/components/layout';
import { AppButton } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState } from '@/components/feedback';
import { TablePosCard, type MergedTableSource } from '@/components/pos/TablePosCard';
import { diningAPI } from '@/api/dining';
import { useTableCardDragDrop } from '@/hooks/useTableCardDragDrop';
import { isValidDropTarget, type TableDragMode } from '@/utils/tableDropRules';
import type { DiningTable } from '@/types/api';
import { getTableCartsRecord, type TableCartSnapshot, type TableCartsRecord } from '@/services/pos/tableCarts';
import { cartTotals } from '@/store/posStore';
import { normalizeApiError } from '@/utils/errors';
import { numberText, money } from '@/utils/format';
import { flexRow, rtlDirection, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';

type TableRow = DiningTable & {
  grouped_into_table_id?: string | null;
  linked_table_sources?: MergedTableSource[];
  current_order?: {
    id?: number;
    total?: number | string;
    items?: unknown[];
    merged_table_sources?: MergedTableSource[];
  } | null;
  dining_hall?: { name?: string | null } | null;
};

type TableSelection = {
  id: string;
  name?: string | null;
  number?: string | null;
  hallName?: string | null;
  activeOrderId?: number | string | null;
};

type StatusKey = 'all' | 'available' | 'occupied' | 'reserved' | 'closed';

type Props = {
  visible: boolean;
  branchId?: string | null;
  isOnline: boolean;
  selectedTableId?: string | null;
  locallyOccupiedIds?: string[];
  onClose: () => void;
  onSelectTable: (table: TableSelection) => void;
  onTransferTable: (
    sourceId: string,
    target: TableSelection,
  ) => Promise<void>;
  onMergeTable: (
    sourceId: string,
    target: TableSelection,
  ) => Promise<void>;
};

const STATUS_KEYS: StatusKey[] = ['all', 'available', 'occupied', 'reserved', 'closed'];

const STATUS_FILTER_LABELS: Record<StatusKey, string> = {
  all: 'الكل',
  available: 'متاحة',
  occupied: 'مشغولة',
  reserved: 'محجوزة',
  closed: 'مغلقة',
};

function resolveOrderPreview(table: TableRow, cached?: TableCartSnapshot | null): {
  orderId?: number | string | null;
  itemCount: number;
  total: number;
  customerName?: string | null;
  isLocalOnly: boolean;
} | null {
  const serverOrder = table.current_order;
  if (hasServerOrder(table)) {
    const items = Array.isArray(serverOrder?.items) ? serverOrder.items : [];
    const serverTotal = Number(serverOrder?.total ?? 0);
    return {
      orderId: serverOrder?.id ?? null,
      itemCount: items.length,
      total: serverTotal > 0 ? serverTotal : cartTotalsFromSaleItems(items),
      customerName: (serverOrder as { customer?: { name?: string } | null })?.customer?.name ?? null,
      isLocalOnly: false,
    };
  }

  if (cached && cached.lines.length > 0) {
    const totals = cartTotals(cached.lines);
    const itemCount = cached.lines.reduce((sum, line) => sum + line.quantity, 0);
    const discount = Number(cached.cartDiscount ?? 0) + totals.discount;
    return {
      orderId: null,
      itemCount,
      total: Math.max(0, totals.subtotal - discount),
      customerName: cached.customer?.name ?? null,
      isLocalOnly: true,
    };
  }

  return null;
}

function cartTotalsFromSaleItems(items: unknown[]): number {
  return items.reduce<number>((sum, raw) => {
    const item = raw as { quantity?: number; unit_price?: number; discount?: number };
    const qty = Number(item.quantity ?? 0);
    const price = Number(item.unit_price ?? 0);
    const discount = Number(item.discount ?? 0);
    return sum + qty * price - discount;
  }, 0);
}
function hasServerOrder(table: TableRow): boolean {
  const order = table.current_order;
  if (!order) return false;
  if (Array.isArray(order.items)) return order.items.length > 0;
  return true;
}

function resolveEffectiveStatus(
  table: TableRow,
  locallyOccupiedIds: string[],
  cachedTableIds: string[],
  isOnline: boolean,
): string {
  if (table.status === 'closed') return 'closed';
  if (hasServerOrder(table)) return 'occupied';
  const tableId = String(table.id);
  if (isOnline && table.status === 'available' && !hasServerOrder(table)) {
    return 'available';
  }
  if (locallyOccupiedIds.some((id) => String(id) === tableId)) return 'occupied';
  if (cachedTableIds.some((id) => String(id) === tableId)) return 'occupied';
  return String(table.status ?? 'available');
}

function statusTheme(c: AppColors, status: string) {
  switch (status) {
    case 'available':
      return { stripe: c.success, soft: c.softSuccess, border: c.softSuccessBorder, text: c.success };
    case 'occupied':
      return { stripe: c.danger, soft: c.softDanger, border: c.softDangerBorder, text: c.danger };
    case 'reserved':
      return { stripe: c.warning, soft: c.softWarning, border: c.softWarningBorder, text: c.warning };
    case 'closed':
      return { stripe: c.textCaption, soft: c.surfaceMuted, border: c.borderSubtle, text: c.textMuted };
    default:
      return { stripe: c.info, soft: c.softInfo, border: c.softInfoBorder, text: c.info };
  }
}

function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);
  return (
    <Pressable onPress={onPress} style={[s.filterChip, active && s.filterChipActive]}>
      <Text style={[s.filterChipLabel, active && s.filterChipLabelActive]}>{label}</Text>
      {count !== undefined ? (
        <View style={[s.filterChipCount, active && s.filterChipCountActive]}>
          <Text style={[s.filterChipCountText, active && s.filterChipCountTextActive]}>{numberText(count)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function PosTablesSheet({
  visible,
  branchId,
  isOnline,
  selectedTableId,
  locallyOccupiedIds = [],
  onClose,
  onSelectTable,
  onTransferTable,
  onMergeTable,
}: Props) {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);

  const [tables, setTables] = useState<TableRow[]>([]);
  const [status, setStatus] = useState<StatusKey>('all');
  const [hallFilter, setHallFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tableCartsMap, setTableCartsMap] = useState<TableCartsRecord>({});
  const [gridWidth, setGridWidth] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [optimisticMerged, setOptimisticMerged] = useState<Record<string, MergedTableSource[]>>({});

  const { width: windowWidth } = useWindowDimensions();
  const sheetOuterWidth =
    windowWidth >= 600 ? Math.min(windowWidth - spacing.lg * 2, 1100) : windowWidth;
  const gridCols =
    sheetOuterWidth >= 1000 ? 6 : sheetOuterWidth >= 820 ? 5 : sheetOuterWidth >= 640 ? 4 : sheetOuterWidth >= 420 ? 3 : 2;
  const gridGap = spacing.xs;
  const fallbackSheetWidth = sheetOuterWidth - spacing.xl * 2;
  const layoutWidth = gridWidth > 0 ? gridWidth : fallbackSheetWidth;
  const cardWidth = Math.max(96, Math.floor((layoutWidth - gridGap * (gridCols - 1)) / gridCols));

  const load = useCallback(async () => {
    if (!branchId || !visible) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await diningAPI.listTablesForBranch(branchId);
      const data = response.data as { tables?: TableRow[] } | TableRow[];
      setTables(Array.isArray(data) ? data : data.tables ?? []);
    } catch (err) {
      setMessage(normalizeApiError(err).message);
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, visible]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!visible) return;
    void getTableCartsRecord().then(setTableCartsMap);
  }, [visible, locallyOccupiedIds.join('|')]);

  const cachedTableIds = useMemo(
    () =>
      Object.entries(tableCartsMap)
        .filter(([, snapshot]) => (snapshot?.lines?.length ?? 0) > 0)
        .map(([id]) => String(id)),
    [tableCartsMap],
  );

  const tableEffectiveStatus = useCallback(
    (table: TableRow) => resolveEffectiveStatus(table, locallyOccupiedIds, cachedTableIds, isOnline),
    [locallyOccupiedIds, cachedTableIds, isOnline],
  );

  const rootTables = useMemo(
    () => tables.filter((table) => !table.grouped_into_table_id),
    [tables],
  );

  const counts = useMemo(
    () => ({
      all: rootTables.length,
      available: rootTables.filter((t) => tableEffectiveStatus(t) === 'available').length,
      occupied: rootTables.filter((t) => tableEffectiveStatus(t) === 'occupied').length,
      reserved: rootTables.filter((t) => tableEffectiveStatus(t) === 'reserved').length,
      closed: rootTables.filter((t) => tableEffectiveStatus(t) === 'closed').length,
    }),
    [rootTables, tableEffectiveStatus],
  );

  const halls = useMemo(() => {
    const names = new Set<string>();
    for (const table of tables) names.add(table.dining_hall?.name || 'غير مصنفة');
    return ['all', ...Array.from(names)];
  }, [tables]);

  const visibleTables = useMemo(
    () =>
      rootTables.filter((table) => {
        const hallOk = hallFilter === 'all' || (table.dining_hall?.name || 'غير مصنفة') === hallFilter;
        const statusOk = status === 'all' || tableEffectiveStatus(table) === status;
        return hallOk && statusOk;
      }),
    [hallFilter, status, rootTables, tableEffectiveStatus],
  );

  const selectionFromTable = (table: TableRow): TableSelection => ({
    id: String(table.id),
    name: table.name ?? null,
    number: table.number != null ? String(table.number) : null,
    hallName: table.dining_hall?.name ?? null,
    activeOrderId: table.current_order?.id ?? null,
  });

  const selectTableContext = (table: TableRow) => {
    if (!isOnline) {
      setMessage('طلبات الطاولات تحتاج اتصالاً بالخادم لحجز المخزون.');
      return;
    }
    if (table.status === 'closed') return;
    onSelectTable(selectionFromTable(table));
  };

  const dropParticipants = useMemo(
    () =>
      visibleTables.map((table) => ({
        id: String(table.id),
        effectiveStatus: tableEffectiveStatus(table) as 'available' | 'occupied' | 'reserved' | 'closed',
        hasServerOrder: hasServerOrder(table),
        groupedIntoTableId: table.grouped_into_table_id ?? null,
      })),
    [visibleTables, tableEffectiveStatus],
  );

  const handleDrop = useCallback(
    async ({ mode, sourceId, targetId }: { mode: TableDragMode; sourceId: string; targetId: string }) => {
      if (!isOnline) {
        setMessage('طلبات الطاولات تحتاج اتصالاً بالخادم.');
        return;
      }
      const source = visibleTables.find((t) => String(t.id) === sourceId);
      const target = visibleTables.find((t) => String(t.id) === targetId);
      if (!source || !target) return;

      const sourceP = {
        id: sourceId,
        effectiveStatus: tableEffectiveStatus(source) as 'available' | 'occupied' | 'reserved' | 'closed',
        hasServerOrder: hasServerOrder(source),
        groupedIntoTableId: source.grouped_into_table_id ?? null,
      };
      const targetP = {
        id: targetId,
        effectiveStatus: tableEffectiveStatus(target) as 'available' | 'occupied' | 'reserved' | 'closed',
        hasServerOrder: hasServerOrder(target),
        groupedIntoTableId: target.grouped_into_table_id ?? null,
      };
      if (!isValidDropTarget(mode, sourceP, targetP)) {
        setMessage(
          mode === 'transfer'
            ? 'النقل يتطلب طاولة هدف فارغة ومتاحة'
            : 'لا يمكن الدمج على هذه الطاولة (مغلقة أو مدمجة مسبقاً)',
        );
        return;
      }

      const targetSelection = selectionFromTable(target);
      setActionLoading(true);
      setMessage(null);
      try {
        if (mode === 'transfer') {
          await onTransferTable(sourceId, targetSelection);
          setMessage('تم نقل الطلب بنجاح');
        } else {
          await onMergeTable(sourceId, targetSelection);
          setMessage('تم دمج الطاولات بنجاح');
        }
        await load();
        setOptimisticMerged({});
      } catch (err) {
        setMessage(normalizeApiError(err).message);
      } finally {
        setActionLoading(false);
      }
    },
    [isOnline, visibleTables, tableEffectiveStatus, onTransferTable, onMergeTable, load],
  );

  const { session, hoverTargetId, startDrag, registerLayout, panHandlers } = useTableCardDragDrop(
    dropParticipants,
    handleDrop,
  );

  const dragMode = session?.mode ?? null;
  const dragSourceId = session?.sourceId ?? null;

  return (
    <AppBottomSheet visible={visible} onClose={onClose} size="wide">
      <View style={s.root}>
        <View style={s.header}>
          <View style={s.headerIcon}>
            <MaterialIcons name="table-restaurant" size={22} color={c.primary} />
          </View>
          <View style={s.headerText}>
            <Text style={s.headerTitle}>الطاولات</Text>
            <Text style={s.headerSubtitle}>اضغط للاختيار · اسحب أيقونة النقل أو الدمج</Text>
          </View>
          <Pressable onPress={() => void load()} style={s.refreshBtn} accessibilityLabel="تحديث الطاولات">
            {loading ? (
              <ActivityIndicator size="small" color={c.primary} />
            ) : (
              <MaterialIcons name="refresh" size={22} color={c.text} />
            )}
          </Pressable>
        </View>

        <View style={s.statsRow}>
          <Pressable
            onPress={() => setStatus('all')}
            style={[s.statCard, s.statCardNeutral, status === 'all' && s.statCardActive]}
          >
            <Text style={s.statCount}>{numberText(counts.all)}</Text>
            <Text style={s.statLabel}>الكل</Text>
          </Pressable>
          {(['available', 'occupied', 'reserved'] as const).map((key) => {
            const theme = statusTheme(c, key);
            return (
              <Pressable
                key={key}
                onPress={() => setStatus(key)}
                style={[s.statCard, { backgroundColor: theme.soft, borderColor: theme.border }, status === key && s.statCardActive]}
              >
                <Text style={[s.statCount, { color: theme.text }]}>{numberText(counts[key])}</Text>
                <Text style={s.statLabel}>{STATUS_FILTER_LABELS[key]}</Text>
              </Pressable>
            );
          })}
        </View>

        {selectedTableId ? (
          <View style={s.selectedBanner}>
            <MaterialIcons name="push-pin" size={18} color={c.primary} />
            <Text style={s.selectedBannerText}>طاولة محددة حالياً في نقطة البيع</Text>
          </View>
        ) : null}

        {!isOnline ? (
          <View style={s.warningBanner}>
            <MaterialIcons name="cloud-off" size={18} color={c.warning} />
            <Text style={s.warningText}>
              وضع الطاولات يحتاج اتصالاً: يُحفظ الطلب على الخادم لحجز المخزون ومنع التكرار.
            </Text>
          </View>
        ) : null}

        {message ? (
          <View style={s.errorBanner}>
            <MaterialIcons name="error-outline" size={18} color={c.danger} />
            <Text style={s.errorText}>{message}</Text>
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersScroll}>
          {STATUS_KEYS.map((key) => (
            <FilterChip
              key={key}
              label={STATUS_FILTER_LABELS[key]}
              count={counts[key]}
              active={status === key}
              onPress={() => setStatus(key)}
            />
          ))}
        </ScrollView>

        {halls.length > 1 ? (
          <>
            <Text style={s.sectionLabel}>الصالة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersScroll}>
              {halls.map((hall) => (
                <FilterChip
                  key={hall}
                  label={hall === 'all' ? 'كل الصالات' : hall}
                  active={hallFilter === hall}
                  onPress={() => setHallFilter(hall)}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        {loading && tables.length === 0 ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={s.loadingText}>جاري تحميل الطاولات...</Text>
          </View>
        ) : null}

        {!loading && visibleTables.length === 0 ? (
          <View style={s.emptyWrap}>
            <View style={s.emptyIcon}>
              <MaterialIcons name="table-bar" size={32} color={c.textCaption} />
            </View>
            <AppEmptyState title="لا توجد طاولات" message="جرّب تغيير الفلتر أو حدّث القائمة." />
          </View>
        ) : null}

        <View
          style={s.grid}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && w !== gridWidth) setGridWidth(w);
          }}
        >
          {visibleTables.map((table) => {
            const tableId = String(table.id);
            const isSelected = selectedTableId != null && String(selectedTableId) === tableId;
            const effectiveStatusKey = tableEffectiveStatus(table);
            const orderPreview = resolveOrderPreview(table, tableCartsMap[tableId]);
            const name = table.name || `طاولة ${table.number ?? table.id}`;
            const hallLine = [table.dining_hall?.name ?? null, table.capacity ? `${numberText(table.capacity)} مقعد` : null]
              .filter(Boolean)
              .join(' · ');
            const apiMerged = [
              ...(Array.isArray(table.linked_table_sources) ? table.linked_table_sources : []),
              ...(Array.isArray(table.current_order?.merged_table_sources)
                ? table.current_order.merged_table_sources
                : []),
            ];
            const mergedSources = optimisticMerged[tableId]?.length
              ? optimisticMerged[tableId]
              : apiMerged;
            const participant = {
              id: tableId,
              effectiveStatus: effectiveStatusKey as 'available' | 'occupied' | 'reserved' | 'closed',
              hasServerOrder: hasServerOrder(table),
              groupedIntoTableId: table.grouped_into_table_id ?? null,
            };
            const source = dragSourceId
              ? dropParticipants.find((t) => t.id === dragSourceId)
              : null;
            const validDrop =
              dragMode && source ? isValidDropTarget(dragMode, source, participant) : false;
            const isDimmed = Boolean(dragMode && dragSourceId && tableId !== dragSourceId && !validDrop);

            return (
              <View key={table.id} style={[s.gridItem, { width: cardWidth }]}>
                <TablePosCard
                  tableId={tableId}
                  name={name}
                  hallLine={hallLine}
                  effectiveStatus={effectiveStatusKey}
                  hasServerOrder={hasServerOrder(table)}
                  linkedTableSources={table.linked_table_sources}
                  isSelected={isSelected}
                  disabled={actionLoading}
                  isOnline={isOnline}
                  orderPreview={orderPreview}
                  mergedSources={mergedSources}
                  dragMode={dragMode}
                  isValidDrop={validDrop && hoverTargetId === tableId}
                  isDimmed={isDimmed}
                  onSelect={() => selectTableContext(table)}
                  onRegisterLayout={registerLayout}
                  onStartDrag={startDrag}
                  onRelease={
                    hasServerOrder(table) || (table.linked_table_sources?.length ?? 0) > 0
                      ? () => {
                          if (!isOnline) {
                            setMessage('يتطلب اتصالاً بالخادم');
                            return;
                          }
                          void diningAPI
                            .releaseForPos(tableId)
                            .then(() => {
                              setMessage('تم فك دمج الطاولات');
                              void load();
                            })
                            .catch((err: unknown) => {
                              const msg =
                                (err as { response?: { data?: { message?: string } } })?.response
                                  ?.data?.message ?? 'تعذر تحرير الطاولة';
                              setMessage(msg);
                            });
                        }
                      : undefined
                  }
                />
              </View>
            );
          })}
        </View>

        <AppButton
          title="تحديث الطاولات"
          variant="secondary"
          onPress={() => void load()}
          loading={loading || actionLoading}
          fullWidth
        />
      </View>

      {session ? (
        <Modal transparent visible animationType="none">
          <View style={s.dragOverlay} {...panHandlers}>
            <View
              style={[
                s.dragGhost,
                {
                  left: Math.max(8, session.x - 60),
                  top: Math.max(8, session.y - 28),
                },
              ]}
            >
              <MaterialIcons
                name={session.mode === 'transfer' ? 'swap-horiz' : 'link'}
                size={18}
                color={c.primary}
              />
              <Text style={s.dragGhostText}>{session.sourceName}</Text>
            </View>
          </View>
        </Modal>
      ) : null}
    </AppBottomSheet>
  );
}

function createStyles(c: AppColors) {
  const cardShadow = Platform.select({
    ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  });

  return StyleSheet.create({
    root: { gap: spacing.md, paddingBottom: spacing.sm },
    header: { ...flexRow, alignItems: 'center', gap: spacing.md },
    headerIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.xl,
      backgroundColor: c.primarySoftMuted,
      borderWidth: 1,
      borderColor: c.primarySoftBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: { flex: 1, minWidth: 0, gap: 2 },
    headerTitle: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.text,
    },
    headerSubtitle: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
      lineHeight: 18,
    },
    refreshBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.xl,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statsRow: { ...flexRow, direction: 'rtl', gap: spacing.xs },
    statCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.xl,
      borderWidth: 1.5,
      gap: 2,
    },
    statCardNeutral: { backgroundColor: c.surfaceMuted, borderColor: c.borderSubtle },
    statCardActive: { borderColor: c.primary, borderWidth: 2 },
    statCount: { fontSize: typography.cardTitle, fontFamily: fonts.extraBold, fontWeight: '800' },
    statLabel: { ...textStart, fontSize: 10, fontFamily: fonts.medium, color: c.textMuted },
    selectedBanner: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.primarySoftMuted,
      borderWidth: 1,
      borderColor: c.primarySoftBorder,
    },
    selectedBannerText: { ...textStart, flex: 1, fontSize: typography.small, fontFamily: fonts.bold, color: c.primary },
    warningBanner: {
      ...flexRow,
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.softWarning,
      borderWidth: 1,
      borderColor: c.softWarningBorder,
    },
    warningText: { ...textStart, flex: 1, fontSize: typography.tiny, fontFamily: fonts.medium, color: c.warning, lineHeight: 18 },
    errorBanner: {
      ...flexRow,
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.softDanger,
      borderWidth: 1,
      borderColor: c.softDangerBorder,
    },
    errorText: { ...textStart, flex: 1, fontSize: typography.small, fontFamily: fonts.bold, color: c.danger },
    sectionLabel: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      color: c.textCaption,
      letterSpacing: 0.3,
    },
    filtersScroll: { ...flexRow, direction: 'rtl', gap: spacing.xs, paddingVertical: 2 },
    filterChip: {
      ...flexRow,
      direction: 'rtl',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    filterChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    filterChipLabel: { ...textStart, fontSize: typography.small, fontFamily: fonts.bold, color: c.textMuted },
    filterChipLabelActive: { color: c.primaryForeground },
    filterChipCount: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterChipCountActive: { backgroundColor: `${c.primaryForeground}33` },
    filterChipCountText: { fontSize: 10, fontFamily: fonts.bold, color: c.textMuted },
    filterChipCountTextActive: { color: c.primaryForeground },
    loadingBox: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
    loadingText: { fontSize: typography.small, fontFamily: fonts.medium, color: c.textMuted },
    emptyWrap: { alignItems: 'center', gap: spacing.sm },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: radius.xxl,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    grid: { ...flexRow, ...rtlDirection, flexWrap: 'wrap', gap: spacing.xs, alignItems: 'flex-start' },
    gridItem: { flexGrow: 0, flexShrink: 0 },
    dragOverlay: { flex: 1, backgroundColor: 'transparent' },
    dragGhost: {
      position: 'absolute',
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: 2,
      borderColor: c.primary,
      ...cardShadow,
    },
    dragGhostText: { fontSize: typography.small, fontFamily: fonts.bold, color: c.text },
  });
}
