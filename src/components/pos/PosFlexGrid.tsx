import React, { useMemo } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { rtlDirection } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

type Props<T> = {
  data: T[];
  columns: number;
  containerWidth: number;
  keyExtractor: (item: T, index: number) => string;
  renderItem: ListRenderItem<T>;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType | React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  gap?: number;
  contentPadding?: number;
};

function chunkRows<T>(items: T[], columns: number): T[][] {
  if (columns <= 1) return items.map((item) => [item]);
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}

export function PosFlexGrid<T>({
  data,
  columns,
  containerWidth,
  keyExtractor,
  renderItem,
  ListHeaderComponent,
  ListEmptyComponent,
  refreshing,
  onRefresh,
  gap = spacing.md,
  contentPadding = spacing.md,
}: Props<T>) {
  const c = useColors();
  const safeCols = Math.max(1, columns);
  const innerWidth = Math.max(0, containerWidth - contentPadding * 2);
  const tileWidth =
    innerWidth > 0 ? Math.floor((innerWidth - gap * (safeCols - 1)) / safeCols) : undefined;

  const rows = useMemo(() => chunkRows(data, safeCols), [data, safeCols]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { flex: 1, minHeight: 0 },
        content: { paddingHorizontal: contentPadding, paddingBottom: spacing.xl },
        row: {
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap,
          marginBottom: gap,
          ...rtlDirection,
        },
        cell: {
          width: tileWidth,
          maxWidth: tileWidth,
          flexGrow: 0,
          flexShrink: 0,
        },
        cellFlex: { flex: 1, minWidth: 0 },
      }),
    [contentPadding, gap, tileWidth],
  );

  return (
    <FlatList
      style={styles.list}
      data={rows}
      keyExtractor={(row, rowIndex) =>
        row.map((item, i) => keyExtractor(item, rowIndex * safeCols + i)).join('|')
      }
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={styles.content}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={c.accent} />
        ) : undefined
      }
      renderItem={({ item: row, index: rowIndex }) => (
        <View style={styles.row}>
          {row.map((item, colIndex) => {
            const itemIndex = rowIndex * safeCols + colIndex;
            const cell = renderItem({
              item,
              index: itemIndex,
              separators: {
                highlight: () => undefined,
                unhighlight: () => undefined,
                updateProps: () => undefined,
              },
            });
            if (!cell) return null;
            return (
              <View
                key={keyExtractor(item, itemIndex)}
                style={tileWidth ? styles.cell : styles.cellFlex}
              >
                {cell}
              </View>
            );
          })}
        </View>
      )}
      {...(Platform.OS === 'web' ? { nestedScrollEnabled: true } : null)}
    />
  );
}

export function posGridColumns(containerWidth: number, tablet: boolean): number {
  if (!tablet) {
    if (containerWidth >= 600) return 3;
    return 2;
  }
  if (containerWidth >= 1120) return 5;
  if (containerWidth >= 840) return 4;
  if (containerWidth >= 600) return 3;
  return 2;
}
