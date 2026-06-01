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
import { diningAPI } from '@/api/dining';
import { TablePosCard, type MergedTableSource } from '@/components/pos/TablePosCard';
import { AppEmptyState } from '@/components/feedback';
import { AppText as Text } from '@/components/ui/AppText';
import { useTableCardDragDrop } from '@/hooks/useTableCardDragDrop';
import { useNetworkStore } from '@/store/networkStore';
import { isValidDropTarget, type TableDragMode } from '@/utils/tableDropRules';
import { normalizeApiError } from '@/utils/errors';
import { numberText } from '@/utils/format';
import { flexRow } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';

export type WaiterTableRow = {
  id: string;
  name: string;
  number?: string;
  capacity?: number;
  status: string;
  grouped_into_table_id?: string | null;
  dining_hall?: { id: string; name: string };
  linked_table_sources?: MergedTableSource[] | null;
  current_order?: {
    id: number;
    total?: number;
    status?: string;
    merged_table_sources?: MergedTableSource[] | null;
  } | null;
};

type StatusKey = 'all' | 'available' | 'occupied' | 'reserved' | 'closed';

type Props = {
  tables: WaiterTableRow[];
  loading: boolean;
  selectedTableId?: string | null;
  onSelectTable: (table: WaiterTableRow) => void;
  onTablesChanged: () => Promise<void>;
  onMessage?: (message: string) => void;
  onReleasedTable?: (tableId: string) => void;
};

const STATUS_KEYS: StatusKey[] = ['all', 'available', 'occupied', 'reserved', 'closed'];

const STATUS_FILTER_LABELS: Record<StatusKey, string> = {
  all: 'الكل',
  available: 'متاحة',
  occupied: 'مشغولة',
  reserved: 'محجوزة',
  closed: 'مغلقة',
};

function hasServerOrder(table: WaiterTableRow): boolean {
  return Boolean(table.current_order?.id);
}

function effectiveStatus(table: WaiterTableRow): string {
  if (table.status === 'closed') return 'closed';
  if (hasServerOrder(table)) return 'occupied';
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

export function WaiterTablesGrid({
  tables,
  loading,
  selectedTableId,
  onSelectTable,
  onTablesChanged,
  onMessage,
  onReleasedTable,
}: Props) {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);
  const isOnline = useNetworkStore((st) => st.isOnline);

  const [status, setStatus] = useState<StatusKey>('all');
  const [hallFilter, setHallFilter] = useState<string>('all');
  const [gridWidth, setGridWidth] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [optimisticMerged, setOptimisticMerged] = useState<Record<string, MergedTableSource[]>>({});

  const { width: windowWidth } = useWindowDimensions();
  const gridCols =
    windowWidth >= 1000 ? 6 : windowWidth >= 820 ? 5 : windowWidth >= 640 ? 4 : windowWidth >= 420 ? 3 : 2;
  const gridGap = spacing.xs;
  const layoutWidth = gridWidth > 0 ? gridWidth : windowWidth - spacing.lg * 2;
  const cardWidth = Math.max(96, Math.floor((layoutWidth - gridGap * (gridCols - 1)) / gridCols));

  const rootTables = useMemo(
    () => tables.filter((table) => !table.grouped_into_table_id),
    [tables],
  );

  const tableStatus = useCallback((table: WaiterTableRow) => effectiveStatus(table), []);

  const counts = useMemo(
    () => ({
      all: rootTables.length,
      available: rootTables.filter((t) => tableStatus(t) === 'available').length,
      occupied: rootTables.filter((t) => tableStatus(t) === 'occupied').length,
      reserved: rootTables.filter((t) => tableStatus(t) === 'reserved').length,
      closed: rootTables.filter((t) => tableStatus(t) === 'closed').length,
    }),
    [rootTables, tableStatus],
  );

  const halls = useMemo(() => {
    const names = new Set<string>();
    for (const table of rootTables) names.add(table.dining_hall?.name || 'غير مصنفة');
    return ['all', ...Array.from(names)];
  }, [rootTables]);

  const visibleTables = useMemo(
    () =>
      rootTables.filter((table) => {
        const hallOk = hallFilter === 'all' || (table.dining_hall?.name || 'غير مصنفة') === hallFilter;
        const statusOk = status === 'all' || tableStatus(table) === status;
        return hallOk && statusOk;
      }),
    [hallFilter, status, rootTables, tableStatus],
  );

  const dropParticipants = useMemo(
    () =>
      visibleTables.map((table) => ({
        id: String(table.id),
        effectiveStatus: tableStatus(table) as 'available' | 'occupied' | 'reserved' | 'closed',
        hasServerOrder: hasServerOrder(table),
        groupedIntoTableId: table.grouped_into_table_id ?? null,
      })),
    [visibleTables, tableStatus],
  );

  const notify = useCallback(
    (msg: string) => {
      onMessage?.(msg);
    },
    [onMessage],
  );

  const handleDrop = useCallback(
    async ({ mode, sourceId, targetId }: { mode: TableDragMode; sourceId: string; targetId: string }) => {
      if (!isOnline) {
        notify('الدمج والنقل يحتاجان اتصالاً بالإنترنت.');
        return;
      }
      const source = visibleTables.find((t) => String(t.id) === sourceId);
      const target = visibleTables.find((t) => String(t.id) === targetId);
      if (!source || !target) return;

      const sourceP = {
        id: sourceId,
        effectiveStatus: tableStatus(source) as 'available' | 'occupied' | 'reserved' | 'closed',
        hasServerOrder: hasServerOrder(source),
        groupedIntoTableId: source.grouped_into_table_id ?? null,
      };
      const targetP = {
        id: targetId,
        effectiveStatus: tableStatus(target) as 'available' | 'occupied' | 'reserved' | 'closed',
        hasServerOrder: hasServerOrder(target),
        groupedIntoTableId: target.grouped_into_table_id ?? null,
      };
      if (!isValidDropTarget(mode, sourceP, targetP)) {
        notify(
          mode === 'transfer'
            ? 'النقل يتطلب طاولة هدف فارغة ومتاحة'
            : 'لا يمكن الدمج على هذه الطاولة (مغلقة أو مدمجة مسبقاً)',
        );
        return;
      }

      setActionLoading(true);
      try {
        if (mode === 'transfer') {
          await diningAPI.transferOrder(sourceId, targetId);
          notify('تم نقل الطلب بنجاح');
        } else {
          setOptimisticMerged((prev) => {
            const list = prev[targetId] ?? [];
            if (list.some((m) => m.id === sourceId)) return prev;
            return {
              ...prev,
              [targetId]: [...list, { id: sourceId, name: source.name }],
            };
          });
          await diningAPI.mergeOrder(sourceId, targetId);
          notify('تم دمج الطاولات بنجاح');
        }
        setOptimisticMerged({});
        await onTablesChanged();
      } catch (err) {
        setOptimisticMerged({});
        notify(normalizeApiError(err).message);
      } finally {
        setActionLoading(false);
      }
    },
    [isOnline, visibleTables, tableStatus, notify, onTablesChanged],
  );

  const { session, hoverTargetId, startDrag, registerLayout, panHandlers } = useTableCardDragDrop(
    dropParticipants,
    handleDrop,
  );

  const dragMode = session?.mode ?? null;
  const dragSourceId = session?.sourceId ?? null;

  useEffect(() => {
    if (!loading) setOptimisticMerged({});
  }, [tables, loading]);

  return (
    <View style={s.root}>
      <View style={s.hintRow}>
        <MaterialIcons name="swap-horiz" size={16} color={c.primary} />
        <Text style={s.hintText}>اسحب أيقونة النقل لطاولة فارغة</Text>
        <MaterialIcons name="link" size={16} color={c.primary} />
        <Text style={s.hintText}>اسحب الدمج لدمج طاولتين</Text>
      </View>

      {!isOnline ? (
        <View style={s.warningBanner}>
          <MaterialIcons name="cloud-off" size={18} color={c.warning} />
          <Text style={s.warningText}>بدون اتصال — الدمج والنقل غير متاحين</Text>
        </View>
      ) : null}

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
              style={[
                s.statCard,
                { backgroundColor: theme.soft, borderColor: theme.border },
                status === key && s.statCardActive,
              ]}
            >
              <Text style={[s.statCount, { color: theme.text }]}>{numberText(counts[key])}</Text>
              <Text style={s.statLabel}>{STATUS_FILTER_LABELS[key]}</Text>
            </Pressable>
          );
        })}
      </View>

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
      ) : null}

      {loading && tables.length === 0 ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={s.loadingText}>جاري تحميل الطاولات...</Text>
        </View>
      ) : null}

      {!loading && visibleTables.length === 0 ? (
        <View style={s.emptyWrap}>
          <AppEmptyState title="لا توجد طاولات" message="جرّب تغيير الفلتر." />
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
          const effectiveStatusKey = tableStatus(table);
          const name = table.name || `طاولة ${table.number ?? table.id}`;
          const hallLine = [
            table.dining_hall?.name ?? null,
            table.capacity ? `${numberText(table.capacity)} مقعد` : null,
          ]
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
          const orderPreview = table.current_order
            ? {
                orderId: table.current_order.id,
                itemCount: 0,
                total: Number(table.current_order.total ?? 0),
                isLocalOnly: false,
              }
            : null;
          const participant = {
            id: tableId,
            effectiveStatus: effectiveStatusKey as 'available' | 'occupied' | 'reserved' | 'closed',
            hasServerOrder: hasServerOrder(table),
            groupedIntoTableId: table.grouped_into_table_id ?? null,
          };
          const source = dragSourceId ? dropParticipants.find((t) => t.id === dragSourceId) : null;
          const validDrop =
            dragMode && source ? isValidDropTarget(dragMode, source, participant) : false;
          const isDimmed = Boolean(dragMode && dragSourceId && tableId !== dragSourceId && !validDrop);

          return (
            <View key={table.id} style={[s.gridItem, { width: cardWidth }]}>
              <TablePosCard
                tableId={tableId}
                name={name}
                hallLine={hallLine}
                capacity={table.capacity}
                effectiveStatus={effectiveStatusKey}
                hasServerOrder={hasServerOrder(table)}
                linkedTableSources={table.linked_table_sources ?? undefined}
                isSelected={isSelected}
                disabled={actionLoading || !isOnline}
                isOnline={isOnline}
                orderPreview={orderPreview}
                mergedSources={mergedSources}
                dragMode={dragMode}
                isValidDrop={validDrop && hoverTargetId === tableId}
                isDimmed={isDimmed}
                onSelect={() => {
                  if (!isOnline) {
                    notify('طلبات الطاولات تحتاج اتصالاً بالإنترنت.');
                    return;
                  }
                  onSelectTable(table);
                }}
                onRegisterLayout={registerLayout}
                onStartDrag={startDrag}
                onRelease={
                  hasServerOrder(table) || (table.linked_table_sources?.length ?? 0) > 0
                    ? () => {
                        if (!isOnline) {
                          notify('يتطلب اتصالاً بالخادم');
                          return;
                        }
                        setActionLoading(true);
                        void diningAPI
                          .releaseForPos(tableId)
                          .then(async () => {
                            notify('تم تحرير الطاولة');
                            onReleasedTable?.(tableId);
                            await onTablesChanged();
                          })
                          .catch((err: unknown) => {
                            notify(normalizeApiError(err).message);
                          })
                          .finally(() => setActionLoading(false));
                      }
                    : undefined
                }
              />
            </View>
          );
        })}
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
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { gap: spacing.md },
    hintRow: { ...flexRow, flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
    hintText: { fontSize: typography.tiny, fontFamily: fonts.medium, color: c.textMuted },
    warningBanner: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: c.softWarning,
      borderWidth: 1,
      borderColor: c.softWarningBorder,
    },
    warningText: { flex: 1, fontSize: typography.tiny, fontFamily: fonts.medium, color: c.warning },
    statsRow: { ...flexRow, gap: spacing.xs },
    statCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surfaceMuted,
    },
    statCardNeutral: { backgroundColor: c.surface },
    statCardActive: { borderColor: c.primary, borderWidth: 2 },
    statCount: { fontSize: typography.body, fontFamily: fonts.extraBold, color: c.text },
    statLabel: { fontSize: 9, fontFamily: fonts.medium, color: c.textMuted },
    filtersScroll: { gap: spacing.xs, paddingVertical: spacing.xs },
    filterChip: {
      ...flexRow,
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surfaceMuted,
    },
    filterChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    filterChipLabel: { fontSize: typography.tiny, fontFamily: fonts.bold, color: c.textMuted },
    filterChipLabelActive: { color: c.primaryForeground },
    filterChipCount: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
    },
    filterChipCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
    filterChipCountText: { fontSize: 9, fontFamily: fonts.bold, color: c.textMuted },
    filterChipCountTextActive: { color: c.primaryForeground },
    loadingBox: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
    loadingText: { fontSize: typography.tiny, color: c.textMuted },
    emptyWrap: { paddingVertical: spacing.lg },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    gridItem: { minWidth: 96 },
    dragOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
    dragGhost: {
      position: 'absolute',
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: c.primary,
      backgroundColor: c.surface,
      ...Platform.select({
        ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
        android: { elevation: 8 },
        default: {},
      }),
    },
    dragGhostText: { fontSize: typography.small, fontFamily: fonts.bold, color: c.text },
  });
}
