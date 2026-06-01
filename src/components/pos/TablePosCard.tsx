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
  hallLine: string;
  capacity?: number;
  effectiveStatus: string;
  hasServerOrder: boolean;
  linkedTableSources?: MergedTableSource[];
  isSelected: boolean;
  disabled: boolean;
  isOnline: boolean;
  orderPreview: OrderPreview;
  mergedSources?: MergedTableSource[];
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

function uniqueLinked(
  primaryId: string,
  linked: MergedTableSource[],
  optimistic: MergedTableSource[],
): MergedTableSource[] {
  const map = new Map<string, MergedTableSource>();
  for (const entry of [...linked, ...optimistic]) {
    if (entry?.id && entry.id !== primaryId) map.set(entry.id, entry);
  }
  return [...map.values()];
}

export function TablePosCard({
  tableId,
  name,
  hallLine,
  capacity = 0,
  effectiveStatus,
  hasServerOrder,
  linkedTableSources = [],
  isSelected,
  disabled,
  isOnline,
  orderPreview,
  mergedSources = [],
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

  const linked = useMemo(
    () => uniqueLinked(tableId, linkedTableSources, mergedSources),
    [tableId, linkedTableSources, mergedSources],
  );
  const hasGroup = linked.length > 0;
  const displayName = hasGroup ? [name, ...linked.map((l) => l.name)].join(' + ') : name;
  const displayCapacity =
    capacity + linked.reduce((sum, item) => sum + Number(item.capacity ?? 0), 0);

  const participant = {
    id: tableId,
    effectiveStatus: effectiveStatus as 'available' | 'occupied' | 'reserved' | 'closed',
    hasServerOrder,
  };
  const showMerge = effectiveStatus !== 'closed' && isOnline && !disabled;
  const showTransfer = effectiveStatus === 'occupied' && isOnline && !disabled;
  const canTransfer = canStartDrag('transfer', participant);
  const canMerge = canStartDrag('merge', participant);

  const s = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: radius.lg,
          borderWidth: isValidDrop || hasGroup || isSelected ? 2 : 1,
          overflow: 'hidden',
          borderColor: isValidDrop ? c.primary : isSelected ? c.primary : hasGroup ? c.primarySoftBorder : theme.border,
          backgroundColor: isValidDrop ? c.primarySoftMuted : isSelected ? c.primarySoftMuted : c.surface,
          borderStyle: isValidDrop ? 'dashed' : 'solid',
          opacity: isDimmed ? 0.35 : 1,
        },
        stripe: { height: 3, backgroundColor: theme.stripe },
        toolbar: {
          ...flexRow,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xs,
          paddingTop: spacing.xs,
          minHeight: 36,
        },
        handles: { ...flexRow, alignItems: 'center', gap: 4 },
        handleBtn: {
          width: 32,
          height: 32,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          backgroundColor: c.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        handleDisabled: { opacity: 0.35 },
        body: { padding: spacing.sm, paddingTop: spacing.xs, gap: 4 },
        titleRow: { ...flexRow, alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap' },
        mergePill: {
          ...flexRow,
          alignItems: 'center',
          gap: 2,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: radius.pill,
          backgroundColor: c.primarySoftMuted,
          borderWidth: 1,
          borderColor: c.primarySoftBorder,
        },
        mergePillText: { fontSize: 9, fontFamily: fonts.bold, color: c.primary },
        dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.stripe },
        title: { ...textStart, fontSize: typography.small, fontFamily: fonts.bold, color: c.text, textAlign: 'center' },
        hall: { ...textStart, fontSize: 9, fontFamily: fonts.medium, color: c.textMuted, textAlign: 'center' },
        pill: {
          alignSelf: 'center',
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: radius.sm,
          backgroundColor: theme.soft,
          borderWidth: 1,
          borderColor: theme.border,
        },
        pillText: { fontSize: 9, fontFamily: fonts.bold, color: theme.text, textAlign: 'center' },
        orderLine: { ...textStart, fontSize: typography.tiny, fontFamily: fonts.bold, color: c.text, textAlign: 'center' },
      }),
    [c, theme, hasGroup, isSelected, isValidDrop],
  );

  const measure = () => {
    rootRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) onRegisterLayout(tableId, { x, y, width, height });
    });
  };

  return (
    <View ref={rootRef} onLayout={measure} collapsable={false}>
      <View style={s.card}>
        <View style={s.stripe} />
        <View style={s.toolbar}>
          <View style={s.handles}>
            {showTransfer ? (
              <Pressable
                style={[s.handleBtn, !canTransfer && s.handleDisabled]}
                disabled={!canTransfer}
                onPressIn={(e) => canTransfer && onStartDrag('transfer', tableId, name, e)}
                accessibilityLabel="سحب للنقل"
              >
                <MaterialIcons name="swap-horiz" size={18} color={c.text} />
              </Pressable>
            ) : null}
            {showMerge ? (
              <Pressable
                style={[s.handleBtn, !canMerge && s.handleDisabled]}
                disabled={!canMerge}
                onPressIn={(e) => canMerge && onStartDrag('merge', tableId, name, e)}
                accessibilityLabel="سحب للدمج"
              >
                <MaterialIcons name="link" size={18} color={c.text} />
              </Pressable>
            ) : null}
          </View>
          {onRelease ? (
            <Pressable
              onPress={onRelease}
              style={[s.handleBtn, { backgroundColor: c.softDanger, borderColor: c.softDangerBorder }]}
              accessibilityLabel="فك الدمج"
            >
              <MaterialIcons name="close" size={18} color={c.danger} />
            </Pressable>
          ) : isSelected ? (
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
            <View style={{ width: 22 }} />
          )}
        </View>

        <Pressable onPress={onSelect} disabled={disabled} style={s.body}>
          <View style={s.titleRow}>
            {hasGroup ? (
              <View style={s.mergePill}>
                <MaterialIcons name="link" size={10} color={c.primary} />
                <Text style={s.mergePillText}>دمج</Text>
              </View>
            ) : null}
            <View style={s.dot} />
            <Text style={s.title}>{displayName}</Text>
          </View>
          {hallLine ? <Text style={s.hall}>{hallLine}</Text> : null}
          <View style={s.pill}>
            <Text style={s.pillText}>{tableStatusLabel(effectiveStatus)}</Text>
          </View>
          <Text style={{ ...textStart, fontSize: typography.tiny, color: c.textMuted, textAlign: 'center' }}>
            {numberText(displayCapacity)} مقعد
          </Text>
          {orderPreview ? (
            <Text style={s.orderLine}>
              {money(orderPreview.total)}
              {orderPreview.itemCount > 0 ? ` · ${numberText(orderPreview.itemCount)} ص` : ''}
            </Text>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}
