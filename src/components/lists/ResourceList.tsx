import React, { useMemo } from 'react';
import { FlatList, ListRenderItem, RefreshControl, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';

type Props<T> = {
  data: T[];
  loading?: boolean;
  error?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  emptyTitle?: string;
  noPadding?: boolean;
};

export function ResourceList<T>({ data, loading, error, refreshing, onRefresh, onEndReached, renderItem, keyExtractor, emptyTitle, noPadding }: Props<T>) {
  const tabBarInset = useTabBarBottomInset(spacing.lg);
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const contentStyle = useMemo(
    () => [styles.content, { paddingBottom: tabBarInset }, noPadding ? styles.noPadding : undefined],
    [noPadding, tabBarInset, styles],
  );

  if (loading && data.length === 0) return <AppLoadingState variant="skeleton" skeletonRows={8} />;
  if (error && data.length === 0) return <AppErrorState message={error} onRetry={onRefresh} />;

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={contentStyle}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={c.accent} /> : undefined}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={<AppEmptyState title={emptyTitle || 'لا توجد بيانات'} />}
    />
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
    noPadding: { padding: 0 },
    separator: { height: 1, backgroundColor: c.borderSubtle },
  });
}
