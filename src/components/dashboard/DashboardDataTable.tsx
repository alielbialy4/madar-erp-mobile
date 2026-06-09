import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import { AppBadge, AppText as Text } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { contentAreaRtl, flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { DashboardSection } from './DashboardSection';

export type DashboardTableColumn = {
  key: string;
  label: string;
  align?: 'start' | 'center' | 'end';
  width?: number;
  flex?: number;
};

export type DashboardTableRow = Record<string, React.ReactNode>;

type Props = {
  title: string;
  hint?: string;
  badge?: string;
  badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  columns: DashboardTableColumn[];
  rows: DashboardTableRow[];
  emptyMessage?: string;
  footerHint?: string;
};

const MIN_TABLE_WIDTH = 640;

function resolveColumnWidths(columns: DashboardTableColumn[], tableWidth: number): number[] {
  const fixedTotal = columns.reduce((sum, col) => sum + (col.width ?? 0), 0);
  const flexTotal = columns.reduce((sum, col) => sum + (col.width ? 0 : col.flex ?? 1), 0);
  const remaining = Math.max(tableWidth - fixedTotal, 0);

  const widths = columns.map((col) => {
    if (col.width) return col.width;
    const flex = col.flex ?? 1;
    return Math.max(Math.floor((remaining * flex) / flexTotal), 72);
  });

  const diff = tableWidth - widths.reduce((sum, w) => sum + w, 0);
  if (diff !== 0) {
    for (let i = columns.length - 1; i >= 0; i -= 1) {
      if (!columns[i].width) {
        widths[i] += diff;
        break;
      }
    }
  }

  return widths;
}

export function DashboardDataTable({
  title,
  hint,
  badge,
  badgeTone = 'neutral',
  columns,
  rows,
  emptyMessage = 'لا توجد بيانات.',
  footerHint,
}: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setContainerWidth(w);
  }, []);

  const tableWidth = Math.max(containerWidth, MIN_TABLE_WIDTH);
  const columnWidths = useMemo(
    () => resolveColumnWidths(columns, tableWidth),
    [columns, tableWidth],
  );
  const scrollable = containerWidth > 0 && tableWidth > containerWidth;

  const renderCell = (col: DashboardTableColumn, width: number, content: React.ReactNode, header?: boolean) => (
    <View
      key={col.key}
      style={[
        styles.cell,
        { width },
        col.align === 'center' && styles.cellCenter,
        col.align === 'end' && styles.cellEnd,
      ]}
    >
      {header ? (
        <Text style={styles.headerText}>{col.label}</Text>
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
        <View style={[styles.cellSlot, col.align === 'center' && styles.cellSlotCenter, col.align === 'end' && styles.cellSlotEnd]}>
          {content}
        </View>
      )}
    </View>
  );

  const tableBody = (
    <View style={[styles.table, { width: tableWidth }]}>
      <View style={[styles.headerRow, { borderBottomColor: c.borderSubtle, backgroundColor: c.surfaceMuted }]}>
        {columns.map((col, idx) => renderCell(col, columnWidths[idx], col.label, true))}
      </View>
      {rows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>{emptyMessage}</Text>
        </View>
      ) : (
        rows.map((row, rowIdx) => (
          <View
            key={`row-${rowIdx}`}
            style={[
              styles.dataRow,
              { borderBottomColor: c.borderSubtle },
              rowIdx === rows.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            {columns.map((col, idx) => renderCell(col, columnWidths[idx], row[col.key]))}
          </View>
        ))
      )}
    </View>
  );

  return (
    <DashboardSection title={title} hint={hint} icon="table-chart" iconTone="info" badge={badge} badgeTone={badgeTone}>
      <View onLayout={onLayout} style={styles.wrap}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
          {scrollable ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {tableBody}
            </ScrollView>
          ) : (
            tableBody
          )}
          {footerHint ? (
            <View style={[styles.footer, { borderTopColor: c.borderSubtle }]}>
              <Text style={[styles.footerText, { color: c.textMuted }]}>{footerHint}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </DashboardSection>
  );
}

export function StockStatusBadge({ quantity }: { quantity: number }) {
  const label = quantity <= 0 ? 'نفد' : 'منخفض';
  const tone = quantity <= 0 ? 'danger' : 'warning';
  return <AppBadge label={label} tone={tone} />;
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrap: {
      width: '100%',
    },
    card: {
      borderRadius: radius.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
      width: '100%',
    },
    scrollContent: {
      flexGrow: 1,
    },
    table: {
      ...contentAreaRtl,
    },
    headerRow: {
      ...flexRow,
      borderBottomWidth: StyleSheet.hairlineWidth,
      width: '100%',
    },
    dataRow: {
      ...flexRow,
      borderBottomWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
      width: '100%',
    },
    cell: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      flexShrink: 0,
    },
    cellCenter: { alignItems: 'center' },
    cellEnd: { alignItems: 'flex-end' },
    cellSlot: {
      width: '100%',
    },
    cellSlotCenter: {
      alignItems: 'center',
    },
    cellSlotEnd: {
      alignItems: 'flex-end',
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
    cellTextCenter: {
      textAlign: 'center',
      width: '100%',
    },
    cellTextEnd: {
      writingDirection: 'ltr',
      textAlign: 'left',
      width: '100%',
    },
    empty: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: typography.small,
      fontFamily: fonts.regular,
      textAlign: 'center',
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    footerText: {
      ...textStart,
      fontSize: 11,
      fontFamily: fonts.regular,
      textAlign: 'center',
      width: '100%',
    },
  });
}
