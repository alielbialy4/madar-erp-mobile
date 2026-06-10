import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import type { DashboardTableColumn } from '@/components/dashboard/DashboardDataTable';
import { useColors } from '@/hooks/useColors';
import { chevronForwardIcon } from '@/utils/rtl';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

function columnFlex(col: DashboardTableColumn): number {
  if (col.width) return 0;
  return col.flex ?? 1;
}

type CellProps = {
  col: DashboardTableColumn;
  content: React.ReactNode;
  header?: boolean;
  flex: number;
  fixedWidth?: number;
};

function TableCell({ col, content, header, flex, fixedWidth }: CellProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const style = fixedWidth ? { width: fixedWidth, flexShrink: 0 } : { flex, minWidth: 0 };

  return (
    <View
      style={[
        styles.cell,
        style,
        col.align === 'center' && styles.cellCenter,
        col.align === 'end' && styles.cellEnd,
      ]}
    >
      {header ? (
        <Text style={styles.headerText} numberOfLines={1}>
          {col.label}
        </Text>
      ) : typeof content === 'string' || typeof content === 'number' ? (
        <Text
          style={[
            styles.cellText,
            col.align === 'center' && styles.cellTextCenter,
            col.align === 'end' && styles.cellTextEnd,
          ]}
          numberOfLines={2}
        >
          {String(content)}
        </Text>
      ) : (
        <View
          style={[
            styles.cellSlot,
            col.align === 'center' && styles.cellSlotCenter,
            col.align === 'end' && styles.cellSlotEnd,
          ]}
        >
          {content}
        </View>
      )}
    </View>
  );
}

export function InventoryTableHeaderRow({
  columns,
  showChevron,
}: {
  columns: DashboardTableColumn[];
  showChevron?: boolean;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View
      style={[
        styles.row,
        styles.headerRow,
        { borderBottomColor: c.borderSubtle, backgroundColor: c.surfaceMuted },
      ]}
    >
      {columns.map((col) => (
        <TableCell
          key={col.key}
          col={col}
          content={col.label}
          header
          flex={columnFlex(col)}
          fixedWidth={col.width}
        />
      ))}
      {showChevron ? <View style={styles.chevronCell} /> : null}
    </View>
  );
}

export function InventoryTableDataRow({
  columns,
  cells,
  showChevron,
  onPress,
  isLast,
}: {
  columns: DashboardTableColumn[];
  cells: Record<string, React.ReactNode>;
  showChevron?: boolean;
  onPress?: () => void;
  isLast?: boolean;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const row = (
    <View
      style={[
        styles.row,
        styles.dataRow,
        { borderBottomColor: c.borderSubtle },
        isLast && { borderBottomWidth: 0 },
      ]}
    >
      {columns.map((col) => (
        <TableCell
          key={col.key}
          col={col}
          content={cells[col.key]}
          flex={columnFlex(col)}
          fixedWidth={col.width}
        />
      ))}
      {showChevron ? (
        <View style={styles.chevronCell}>
          <MaterialIcons name={chevronForwardIcon()} size={20} color={c.textCaption} />
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return row;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { backgroundColor: c.softPrimary }]}
      accessibilityRole="button"
    >
      {row}
    </Pressable>
  );
}

type Props<T extends Record<string, unknown>> = {
  columns: DashboardTableColumn[];
  items: T[];
  mapRow: (item: T) => Record<string, React.ReactNode>;
  onItemPress?: (item: T) => void;
};

export function InventoryListTable<T extends Record<string, unknown>>({
  columns,
  items,
  mapRow,
  onItemPress,
}: Props<T>) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
      <InventoryTableHeaderRow columns={columns} showChevron={Boolean(onItemPress)} />
      {items.map((item, idx) => (
        <InventoryTableDataRow
          key={`tbl-${idx}`}
          columns={columns}
          cells={mapRow(item)}
          showChevron={Boolean(onItemPress)}
          onPress={onItemPress ? () => onItemPress(item) : undefined}
          isLast={idx === items.length - 1}
        />
      ))}
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
      width: '100%',
    },
    row: { ...flexRow, alignItems: 'center', width: '100%' },
    headerRow: { borderBottomWidth: StyleSheet.hairlineWidth },
    dataRow: { borderBottomWidth: StyleSheet.hairlineWidth },
    cell: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm + 2,
    },
    cellCenter: { alignItems: 'center' },
    cellEnd: { alignItems: 'flex-end' },
    cellSlot: { width: '100%' },
    cellSlotCenter: { alignItems: 'center' },
    cellSlotEnd: { alignItems: 'flex-end' },
    chevronCell: {
      width: 28,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    headerText: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      color: c.textMuted,
    },
    cellText: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.medium,
      color: c.text,
    },
    cellTextCenter: { textAlign: 'center', width: '100%' },
    cellTextEnd: { writingDirection: 'ltr', textAlign: 'left', width: '100%' },
  });
}
