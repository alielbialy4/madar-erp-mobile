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
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppSelect } from '@/components/ui/AppSelect';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState } from '@/components/feedback';
import { TablePosCard, type MergedTableSource } from '@/components/pos/TablePosCard';
import { diningAPI } from '@/api/dining';
import { useTableCardDragDrop } from '@/hooks/useTableCardDragDrop';
import { isValidDropTarget, type TableDragMode, type TableDropParticipant } from '@/utils/tableDropRules';
import type { DiningTable } from '@/types/api';
import { getTableCartsRecord, type TableCartSnapshot, type TableCartsRecord } from '@/services/pos/tableCarts';
import { cartTotals } from '@/store/posStore';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { numberText } from '@/utils/format';
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

export type PosTablesModalProps = {
  visible: boolean;
  branchId?: string | null;
  isOnline: boolean;
  selectedTableId?: string | null;
  locallyOccupiedIds?: string[];
  pendingSyncTableIds?: string[];
  onClose: () => void;
  onSelectTable: (table: TableSelection) => void;
  onTransferTable: (sourceId: string, target: TableSelection) => Promise<void>;
  onMergeTable: (sourceId: string, target: TableSelection) => Promise<void>;
};

const STATUS_KEYS: StatusKey[] = ['all', 'available', 'occupied', 'reserved', 'closed'];

const STATUS_FILTER_LABELS: Record<StatusKey, string> = {
  all: 'الكل',
  available: 'متاحة',
  occupied: 'مشغولة',
  reserved: 'محجوزة',
  closed: 'مغلقة',
};

function gridColumns(width: number): number {
  if (width >= 1280) return 8;
  if (width >= 1024) return 7;
  if (width >= 768) return 6;
  if (width >= 640) return 5;
  if (width >= 480) return 4;
  return 3;
}

function isMergedSource(entry: unknown): entry is MergedTableSource {
  return entry != null && typeof entry === 'object' && typeof (entry as MergedTableSource).id === 'string';
}

function isTableRow(row: unknown): row is TableRow {
  return row != null && typeof row === 'object' && (row as TableRow).id != null;
}

function sanitizeTableRow(row: TableRow): TableRow {
  const linked = Array.isArray(row.linked_table_sources)
    ? row.linked_table_sources.filter(isMergedSource)
    : [];
  const order = row.current_order;
  if (order == null || typeof order !== 'object') {
    return { ...row, linked_table_sources: linked, current_order: order ?? null };
  }
  const merged = Array.isArray(order.merged_table_sources)
    ? order.merged_table_sources.filter(isMergedSource)
    : [];
  return {
    ...row,
    linked_table_sources: linked,
    current_order: { ...order, merged_table_sources: merged },
  };
}

function normalizeTableRows(rows: unknown[]): TableRow[] {
  return rows.filter(isTableRow).map(sanitizeTableRow);
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

function resolveOrderPreview(table: TableRow, cached?: TableCartSnapshot | null) {
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

function resolveEffectiveStatus(
  table: TableRow,
  locallyOccupiedIds: string[],
  cachedTableIds: string[],
  isOnline: boolean,
): string {
  if (table.status === 'closed') return 'closed';
  if (hasServerOrder(table)) return 'occupied';
  const tableId = String(table.id);
  if (isOnline && table.status === 'available' && !hasServerOrder(table)) return 'available';
  if (locallyOccupiedIds.some((id) => String(id) === tableId)) return 'occupied';
  if (cachedTableIds.some((id) => String(id) === tableId)) return 'occupied';
  return String(table.status ?? 'available');
}

function getHallName(table: TableRow): string {
  return table.dining_hall?.name || 'غير مصنفة';
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

function renderTableCard(
  table: TableRow,
  ctx: {
    s: ReturnType<typeof createStyles>;
    tableEffectiveStatus: (t: TableRow) => string;
    tableCartsMap: TableCartsRecord;
    selectedTableId?: string | null;
    optimisticMerged: Record<string, MergedTableSource[]>;
    pendingSet: Set<string>;
    actionLoading: boolean;
    isOnline: boolean;
    dragMode: TableDragMode | null;
    dragSourceId: string | null;
    dropParticipants: TableDropParticipant[];
    hoverTargetId: string | null;
    cardWidth: number;
    registerLayout: (id: string, rect: import('@/hooks/useTableCardDragDrop').LayoutRect) => void;
    startDrag: ReturnType<typeof useTableCardDragDrop>['startDrag'];
    selectTableContext: (t: TableRow) => void;
    setMessage: (m: string) => void;
    load: () => Promise<void>;
  },
) {
  const tableId = String(table.id);
  const isCurrent = ctx.selectedTableId != null && String(ctx.selectedTableId) === tableId;
  const effectiveStatusKey = ctx.tableEffectiveStatus(table);
  const orderPreview = resolveOrderPreview(table, ctx.tableCartsMap[tableId]);
  const name = table.name || `طاولة ${table.number ?? table.id}`;
  const apiMerged = [
    ...(table.linked_table_sources ?? []).filter(isMergedSource),
    ...(table.current_order?.merged_table_sources ?? []).filter(isMergedSource),
  ];
  const mergedSources = ctx.optimisticMerged[tableId]?.length ? ctx.optimisticMerged[tableId] : apiMerged;
  const participant = {
    id: tableId,
    effectiveStatus: effectiveStatusKey as 'available' | 'occupied' | 'reserved' | 'closed',
    hasServerOrder: hasServerOrder(table),
    groupedIntoTableId: table.grouped_into_table_id ?? null,
  };
  const source = ctx.dragSourceId ? ctx.dropParticipants.find((t) => t.id === ctx.dragSourceId) : null;
  const validDrop = ctx.dragMode && source ? isValidDropTarget(ctx.dragMode, source, participant) : false;
  const isDimmed = Boolean(ctx.dragMode && ctx.dragSourceId && tableId !== ctx.dragSourceId && !validDrop);

  return (
    <View key={table.id} style={[ctx.s.gridItem, { width: ctx.cardWidth }]}>
      <TablePosCard
        tableId={tableId}
        name={name}
        capacity={Number(table.capacity ?? 0)}
        effectiveStatus={effectiveStatusKey}
        hasServerOrder={hasServerOrder(table)}
        linkedTableSources={table.linked_table_sources ?? []}
        isSelected={isCurrent}
        isCurrent={isCurrent}
        disabled={ctx.actionLoading}
        isOnline={ctx.isOnline}
        orderPreview={orderPreview}
        mergedSources={mergedSources}
        pendingSync={ctx.pendingSet.has(tableId)}
        compact
        showHallLine={false}
        dragMode={ctx.dragMode}
        isValidDrop={validDrop && ctx.hoverTargetId === tableId}
        isDimmed={isDimmed}
        onSelect={() => ctx.selectTableContext(table)}
        onRegisterLayout={ctx.registerLayout}
        onStartDrag={ctx.startDrag}
        onRelease={
          hasServerOrder(table) || (table.linked_table_sources?.length ?? 0) > 0
            ? () => {
                if (!ctx.isOnline) {
                  ctx.setMessage('يتطلب اتصالاً بالخادم');
                  return;
                }
                void diningAPI
                  .releaseForPos(tableId)
                  .then(() => {
                    ctx.setMessage('تم فك دمج الطاولات');
                    void ctx.load();
                  })
                  .catch((err: unknown) => {
                    const msg =
                      (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                      'تعذر تحرير الطاولة';
                    ctx.setMessage(msg);
                  });
              }
            : undefined
        }
      />
    </View>
  );
}

export function PosTablesModal({
  visible,
  branchId,
  isOnline,
  selectedTableId,
  locallyOccupiedIds = [],
  pendingSyncTableIds = [],
  onClose,
  onSelectTable,
  onTransferTable,
  onMergeTable,
}: PosTablesModalProps) {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);
  const { width: windowWidth } = useWindowDimensions();

  const [tables, setTables] = useState<TableRow[]>([]);
  const [status, setStatus] = useState<StatusKey>('all');
  const [hallFilter, setHallFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tableCartsMap, setTableCartsMap] = useState<TableCartsRecord>({});
  const [gridWidth, setGridWidth] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [optimisticMerged, setOptimisticMerged] = useState<Record<string, MergedTableSource[]>>({});

  const gridCols = gridColumns(windowWidth);
  const gridGap = 10;
  const layoutWidth = gridWidth > 0 ? gridWidth : windowWidth - spacing.lg * 2;
  const cardWidth = Math.max(96, Math.floor((layoutWidth - gridGap * (gridCols - 1)) / gridCols));
  const pendingSet = useMemo(() => new Set(pendingSyncTableIds.map(String)), [pendingSyncTableIds]);

  const load = useCallback(async () => {
    if (!branchId || !visible) return;
    setLoading(true);
    setMessage(null);
    try {
      const apiStatus = status === 'all' ? undefined : status;
      const response = await diningAPI.listTablesForBranch(branchId, apiStatus);
      if (response.status === 'error') {
        throw new Error(response.message || 'تعذر جلب الطاولات');
      }
      setTables(normalizeTableRows(extractArray<TableRow>(response)));
    } catch (err) {
      if (__DEV__) {
        console.error('[PosTablesModal] load tables failed', err instanceof Error ? err.stack : err);
      }
      setMessage(normalizeApiError(err).message);
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, visible, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!visible) return;
    void getTableCartsRecord().then((map) => {
      const safe: TableCartsRecord = {};
      for (const [id, snapshot] of Object.entries(map ?? {})) {
        if (snapshot != null && typeof snapshot === 'object' && Array.isArray(snapshot.lines)) {
          safe[id] = snapshot;
        }
      }
      setTableCartsMap(safe);
    });
  }, [visible, locallyOccupiedIds.join('|')]);

  const cachedTableIds = useMemo(
    () =>
      Object.entries(tableCartsMap ?? {})
        .filter(([, snapshot]) => (snapshot?.lines?.length ?? 0) > 0)
        .map(([id]) => String(id)),
    [tableCartsMap],
  );

  const tableEffectiveStatus = useCallback(
    (table: TableRow) => resolveEffectiveStatus(table, locallyOccupiedIds, cachedTableIds, isOnline),
    [locallyOccupiedIds, cachedTableIds, isOnline],
  );

  const rootTables = useMemo(() => tables.filter((table) => !table.grouped_into_table_id), [tables]);

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
    const names = Array.from(new Set(rootTables.map(getHallName))).sort((a, b) => a.localeCompare(b, 'ar'));
    return names;
  }, [rootTables]);

  const hallOptions = useMemo(
    () => [{ value: 'all', label: 'كل الصالات' }, ...halls.map((h) => ({ value: h, label: h }))],
    [halls],
  );

  const filteredTables = useMemo(() => {
    let list = rootTables;
    if (status !== 'all') {
      list = list.filter((table) => tableEffectiveStatus(table) === status);
    }
    if (hallFilter !== 'all') {
      list = list.filter((table) => getHallName(table) === hallFilter);
    }
    return list;
  }, [rootTables, status, hallFilter, tableEffectiveStatus]);

  const tablesByHall = useMemo(() => {
    const map = new Map<string, TableRow[]>();
    for (const table of filteredTables) {
      const hall = getHallName(table);
      const list = map.get(hall) ?? [];
      list.push(table);
      map.set(hall, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, 'ar'));
  }, [filteredTables]);

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
    onClose();
  };

  const dropParticipants = useMemo(
    () =>
      filteredTables.map((table) => ({
        id: String(table.id),
        effectiveStatus: tableEffectiveStatus(table) as 'available' | 'occupied' | 'reserved' | 'closed',
        hasServerOrder: hasServerOrder(table),
        groupedIntoTableId: table.grouped_into_table_id ?? null,
      })),
    [filteredTables, tableEffectiveStatus],
  );

  const handleDrop = useCallback(
    async ({ mode, sourceId, targetId }: { mode: TableDragMode; sourceId: string; targetId: string }) => {
      if (!isOnline) {
        setMessage('طلبات الطاولات تحتاج اتصالاً بالخادم.');
        return;
      }
      const source = filteredTables.find((t) => String(t.id) === sourceId);
      const target = filteredTables.find((t) => String(t.id) === targetId);
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
    [isOnline, filteredTables, tableEffectiveStatus, onTransferTable, onMergeTable, load],
  );

  const { session, hoverTargetId, startDrag, registerLayout, panHandlers } = useTableCardDragDrop(
    dropParticipants,
    handleDrop,
  );

  const dragMode = session?.mode ?? null;
  const dragSourceId = session?.sourceId ?? null;

  const cardCtx = {
    s,
    tableEffectiveStatus,
    tableCartsMap,
    selectedTableId,
    optimisticMerged,
    pendingSet,
    actionLoading,
    isOnline,
    dragMode,
    dragSourceId,
    dropParticipants,
    hoverTargetId,
    cardWidth,
    registerLayout,
    startDrag,
    selectTableContext,
    setMessage,
    load,
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={s.overlay} edges={['top', 'bottom']}>
        <View style={s.headerCard}>
          <View style={s.headerTop}>
            <Pressable onPress={onClose} style={s.backBtn} accessibilityLabel="رجوع">
              <MaterialIcons name="arrow-forward" size={22} color={c.text} />
            </Pressable>
            <View style={s.headerIcon}>
              <MaterialIcons name="table-restaurant" size={22} color={c.primary} />
            </View>
            <View style={s.headerText}>
              <Text style={s.headerTitle}>الطاولات</Text>
              <Text style={s.headerSubtitle}>
                {numberText(rootTables.length)} الكل
                {!isOnline ? ' · غير متصل' : ''}
              </Text>
            </View>
          </View>
          {halls.length > 1 ? (
            <AppSelect label="الصالة" value={hallFilter} options={hallOptions} onChange={setHallFilter} variant="soft" />
          ) : null}
        </View>

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

        {loading && tables.length === 0 ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={s.loadingText}>جاري تحميل الطاولات...</Text>
          </View>
        ) : null}

        {!loading && filteredTables.length === 0 ? (
          <View style={s.emptyWrap}>
            <AppEmptyState title="لا توجد طاولات" message="جرّب تغيير الفلتر." />
          </View>
        ) : (
          <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
            {tablesByHall.map(([hallName, hallTables]) => (
              <View key={hallName}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>{hallName}</Text>
                  <Text style={s.sectionCount}>{numberText(hallTables.length)}</Text>
                </View>
                <View
                  style={[s.grid, { gap: gridGap }]}
                  onLayout={(e) => {
                    const w = e.nativeEvent.layout.width;
                    if (w > 0 && w !== gridWidth) setGridWidth(w);
                  }}
                >
                  {hallTables.map((table) => renderTableCard(table, cardCtx))}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

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
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(c: AppColors) {
  const cardShadow = Platform.select({
    ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  });

  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: c.background },
    headerCard: {
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
      gap: spacing.sm,
    },
    headerTop: { ...flexRow, alignItems: 'center', gap: spacing.sm },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.lg,
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
    },
    warningBanner: {
      ...flexRow,
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.softWarning,
      borderWidth: 1,
      borderColor: c.softWarningBorder,
    },
    warningText: {
      ...textStart,
      flex: 1,
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.warning,
      lineHeight: 18,
    },
    errorBanner: {
      ...flexRow,
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.softDanger,
      borderWidth: 1,
      borderColor: c.softDangerBorder,
    },
    errorText: { ...textStart, flex: 1, fontSize: typography.small, fontFamily: fonts.bold, color: c.danger },
    filtersScroll: {
      ...flexRow,
      direction: 'rtl',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
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
    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    loadingText: { fontSize: typography.small, fontFamily: fonts.medium, color: c.textMuted },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
    sectionHeader: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      marginBottom: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    sectionTitle: { ...textStart, fontSize: typography.body, fontFamily: fonts.bold, color: c.text },
    sectionCount: { fontSize: typography.small, fontFamily: fonts.medium, color: c.textMuted },
    grid: { ...flexRow, ...rtlDirection, flexWrap: 'wrap', alignItems: 'flex-start' },
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
      ...(cardShadow ?? {}),
    },
    dragGhostText: { fontSize: typography.small, fontFamily: fonts.bold, color: c.text },
  });
}
