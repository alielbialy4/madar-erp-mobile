import React, { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent, type View as RNView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { money, numberText } from '@/utils/format';
import { tableStatusLabel } from '@/utils/diningTableStatus';
import { buildGroupedTableTitle, collectLinkedTableSources, sumGroupedCapacity } from '@/utils/tableLinkedSources';
import type { TableDragMode } from '@/utils/tableDropRules';
import { canStartDrag } from '@/utils/tableDropRules';
import type { LayoutRect } from '@/hooks/useTableCardDragDrop';

export type MergedTableSource = { id: string; name: string; capacity?: number };

type OrderPreview = {
  orderId?: number | string | null;
  itemCount: number;
  total: number;
  customerName?: string | null;
  isLocalOnly: boolean;
} | null;

type Props = {
  tableId: string;
  name: string;
  hallLine?: string;
  capacity?: number;
  effectiveStatus: string;
  hasServerOrder: boolean;
  linkedTableSources?: MergedTableSource[] | null;
  isSelected: boolean;
  isCurrent?: boolean;
  disabled: boolean;
  isOnline: boolean;
  orderPreview: OrderPreview;
  mergedSources?: MergedTableSource[];
  pendingSync?: boolean;
  compact?: boolean;
  showHallLine?: boolean;
  dragMode: TableDragMode | null;
  isValidDrop: boolean;
  isDimmed: boolean;
  onSelect: () => void;
  onRegisterLayout: (tableId: string, rect: LayoutRect) => void;
  onStartDrag: (
    mode: TableDragMode,
    sourceId: string,
    sourceName: string,
    event: GestureResponderEvent,
  ) => void;
  onRelease?: () => void;
};

function statusTheme(c: AppColors, status: string) {
  switch (status) {
    case 'available':
      return {
        stripe: [c.success, c.success] as [string, string],
        soft: c.softSuccess,
        border: c.softSuccessBorder,
        text: c.success,
      };
    case 'occupied':
      return {
        stripe: [c.danger, c.warning] as [string, string],
        soft: c.softDanger,
        border: c.softDangerBorder,
        text: c.danger,
      };
    case 'reserved':
      return {
        stripe: [c.warning, c.warning] as [string, string],
        soft: c.softWarning,
        border: c.softWarningBorder,
        text: c.warning,
      };
    case 'closed':
      return {
        stripe: [c.textCaption, c.textMuted] as [string, string],
        soft: c.surfaceMuted,
        border: c.borderSubtle,
        text: c.textMuted,
      };
    default:
      return {
        stripe: [c.info, c.info] as [string, string],
        soft: c.softInfo,
        border: c.softInfoBorder,
        text: c.info,
      };
  }
}

export function TablePosCard({
  tableId,
  name,
  hallLine = '',
  capacity = 0,
  effectiveStatus,
  hasServerOrder,
  linkedTableSources,
  isSelected,
  isCurrent = false,
  disabled,
  isOnline,
  orderPreview,
  mergedSources = [],
  pendingSync = false,
  compact = true,
  showHallLine = false,
  dragMode,
  isValidDrop,
  isDimmed,
  onSelect,
  onRegisterLayout,
  onStartDrag,
  onRelease,
}: Props) {
  const c = useColors();
  const theme = statusTheme(c, effectiveStatus);
  const rootRef = useRef<RNView>(null);
  const highlighted = isSelected || isCurrent;

  const linked = useMemo(
    () =>
      collectLinkedTableSources(
        { id: tableId, linked_table_sources: linkedTableSources ?? null },
        mergedSources ?? [],
      ),
    [tableId, linkedTableSources, mergedSources],
  );
  const hasGroup = linked.length > 0;
  const displayName = buildGroupedTableTitle(name, linked);
  const displayCapacity = sumGroupedCapacity(capacity, linked);
  const showOrderBlock = Boolean(orderPreview && (orderPreview.itemCount > 0 || orderPreview.total > 0));

  const participant = {
    id: tableId,
    effectiveStatus: effectiveStatus as 'available' | 'occupied' | 'reserved' | 'closed',
    hasServerOrder,
  };
  const showMerge = effectiveStatus !== 'closed' && isOnline && !disabled;
  const showTransfer = effectiveStatus === 'occupied' && isOnline && !disabled;
  const canTransfer = canStartDrag('transfer', participant);
  const canMerge = canStartDrag('merge', participant);
  const showRelease = Boolean(onRelease);

  const s = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: compact ? radius.xl : radius.xxl,
          borderWidth: isValidDrop || hasGroup || highlighted ? 2 : 1,
          overflow: 'hidden',
          borderColor: isValidDrop
            ? c.primary
            : highlighted
              ? c.primary
              : hasGroup
                ? c.primarySoftBorder
                : theme.border,
          backgroundColor: isValidDrop ? c.primarySoftMuted : highlighted ? c.primarySoftMuted : c.surface,
          borderStyle: isValidDrop ? 'dashed' : 'solid',
          opacity: isDimmed ? 0.35 : 1,
          minHeight: compact ? 112 : 168,
        },
        stripe: { height: 4 },
        pendingBadge: {
          position: 'absolute',
          top: 6,
          left: 6,
          zIndex: 10,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: radius.pill,
          backgroundColor: c.softWarning,
        },
        pendingText: { fontSize: 8, fontFamily: fonts.bold, color: c.warning },
        toolbar: {
          ...flexRow,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: compact ? 6 : spacing.xs,
          paddingTop: compact ? 4 : spacing.xs,
          minHeight: compact ? 32 : 36,
        },
        handles: { ...flexRow, alignItems: 'center', gap: 4 },
        handleBtn: {
          width: compact ? 28 : 32,
          height: compact ? 28 : 32,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          backgroundColor: c.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        handleDisabled: { opacity: 0.35 },
        releaseBtn: {
          backgroundColor: c.softDanger,
          borderColor: c.softDangerBorder,
        },
        body: {
          paddingHorizontal: compact ? spacing.sm : spacing.md,
          paddingBottom: compact ? spacing.sm : spacing.md,
          paddingTop: compact ? 2 : spacing.xs,
          gap: compact ? 4 : 6,
          alignItems: 'center',
        },
        badgeRow: { ...flexRow, flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
        statusBadge: {
          ...flexRow,
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: compact ? 6 : 8,
          paddingVertical: compact ? 2 : 3,
          borderRadius: radius.pill,
          borderWidth: 1,
          backgroundColor: theme.soft,
          borderColor: theme.border,
        },
        statusDot: {
          width: compact ? 4 : 6,
          height: compact ? 4 : 6,
          borderRadius: 99,
          backgroundColor: theme.text,
        },
        statusText: {
          fontSize: compact ? 9 : 10,
          fontFamily: fonts.bold,
          color: theme.text,
        },
        mergeBadge: {
          ...flexRow,
          alignItems: 'center',
          gap: 2,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: c.primarySoftBorder,
          backgroundColor: c.primarySoftMuted,
        },
        mergeText: { fontSize: 9, fontFamily: fonts.bold, color: c.primary },
        title: {
          ...textStart,
          fontSize: compact ? typography.cardTitle : typography.sectionTitle,
          fontFamily: fonts.extraBold,
          fontWeight: '800',
          color: theme.text,
          textAlign: 'center',
        },
        hall: {
          ...textStart,
          fontSize: 10,
          fontFamily: fonts.medium,
          color: c.textMuted,
          textAlign: 'center',
        },
        capacityPill: {
          ...flexRow,
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: radius.pill,
          backgroundColor: c.surfaceMuted,
        },
        capacityText: { fontSize: 10, fontFamily: fonts.medium, color: c.textMuted },
        orderBlock: {
          width: '100%',
          borderRadius: compact ? radius.md : radius.lg,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          backgroundColor: c.surfaceMuted,
          paddingHorizontal: spacing.sm,
          paddingVertical: compact ? 4 : spacing.sm,
          gap: 2,
        },
        orderRow: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
        orderMeta: { fontSize: 10, fontFamily: fonts.medium, color: c.textMuted },
        orderTotal: { fontSize: compact ? typography.small : typography.body, fontFamily: fonts.bold, color: c.text },
        customerLine: { fontSize: 9, fontFamily: fonts.medium, color: c.textMuted, textAlign: 'center' },
      }),
    [c, theme, compact, hasGroup, highlighted, isValidDrop, isDimmed],
  );

  const measure = () => {
    rootRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) onRegisterLayout(tableId, { x, y, width, height });
    });
  };

  return (
    <View ref={rootRef} onLayout={measure} collapsable={false}>
      <View style={s.card}>
        <View style={[s.stripe, { backgroundColor: theme.stripe[0] }]} />

        {pendingSync ? (
          <View style={s.pendingBadge}>
            <Text style={s.pendingText}>قيد المزامنة</Text>
          </View>
        ) : null}

        <View style={s.toolbar}>
          <View style={s.handles}>
            {showTransfer ? (
              <Pressable
                style={[s.handleBtn, !canTransfer && s.handleDisabled]}
                disabled={!canTransfer}
                onPressIn={(e) => canTransfer && onStartDrag('transfer', tableId, displayName, e)}
                accessibilityLabel="سحب للنقل"
              >
                <MaterialIcons name="swap-horiz" size={compact ? 16 : 18} color={c.text} />
              </Pressable>
            ) : null}
            {showMerge ? (
              <Pressable
                style={[s.handleBtn, !canMerge && s.handleDisabled]}
                disabled={!canMerge}
                onPressIn={(e) => canMerge && onStartDrag('merge', tableId, displayName, e)}
                accessibilityLabel="سحب للدمج"
              >
                <MaterialIcons name="link" size={compact ? 16 : 18} color={c.text} />
              </Pressable>
            ) : null}
          </View>
          {showRelease ? (
            <Pressable onPress={onRelease} style={[s.handleBtn, s.releaseBtn]} accessibilityLabel="فك الدمج">
              <MaterialIcons name="close" size={compact ? 16 : 18} color={c.danger} />
            </Pressable>
          ) : highlighted ? (
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: radius.pill,
                backgroundColor: c.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="check" size={14} color={c.primaryForeground} />
            </View>
          ) : (
            <View style={{ width: compact ? 28 : 32 }} />
          )}
        </View>

        <Pressable onPress={onSelect} disabled={disabled} style={s.body}>
          <View style={s.badgeRow}>
            <View style={s.statusBadge}>
              <View style={s.statusDot} />
              <Text style={s.statusText}>{tableStatusLabel(effectiveStatus)}</Text>
            </View>
            {hasGroup ? (
              <View style={s.mergeBadge}>
                <MaterialIcons name="link" size={10} color={c.primary} />
                <Text style={s.mergeText}>دمج</Text>
              </View>
            ) : null}
          </View>

          <Text style={s.title} numberOfLines={2}>
            {displayName}
          </Text>

          <View style={s.capacityPill}>
            <MaterialIcons name="people-outline" size={12} color={c.textMuted} />
            <Text style={s.capacityText}>{numberText(displayCapacity)} مقعد</Text>
          </View>

          {showOrderBlock && orderPreview ? (
            <View style={s.orderBlock}>
              <View style={s.orderRow}>
                <Text style={s.orderMeta}>
                  {numberText(orderPreview.itemCount)} ص
                </Text>
                <Text style={s.orderTotal}>{money(orderPreview.total)}</Text>
              </View>
              {orderPreview.customerName ? (
                <Text style={s.customerLine} numberOfLines={1}>
                  {orderPreview.customerName}
                </Text>
              ) : null}
            </View>
          ) : null}

          {showHallLine && hallLine ? <Text style={s.hall}>{hallLine}</Text> : null}
        </Pressable>
      </View>
    </View>
  );
}
