import React, { useMemo, useState } from 'react';
import type { ApiEnvelope, ListParams } from '@/types/api';
import { ListScreenLayout } from '@/components/layout/ListScreenLayout';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppText } from '@/components/ui/AppText';
import { AppSwipeRow } from '@/components/ui/AppSwipeRow';
import { DenseRow } from '@/components/madar';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { textStyle } from '@/constants/textStyles';
import { useColors } from '@/hooks/useColors';
import { rowHeight } from '@/constants/spacing';
import type { ModuleIconKey } from '@/constants/iconMap';

const MODULE_EYEBROW: Partial<Record<ModuleIconKey, string>> = {
  delivery: 'العمليات',
  expenses: 'المالية',
  coupons: 'التسويق',
  promotions: 'التسويق',
  purchases: 'المشتريات',
  kitchen: 'المطبخ',
  refunds: 'العمليات',
  users: 'الإعدادات',
};

function defaultHeroEyebrow(moduleIcon?: ModuleIconKey): string {
  if (moduleIcon && MODULE_EYEBROW[moduleIcon]) return MODULE_EYEBROW[moduleIcon]!;
  return 'القائمة';
}

type Badge = { label: string; tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' };

type Props<T extends Record<string, unknown>> = {
  title: string;
  subtitle?: string;
  loader: (params: ListParams) => Promise<ApiEnvelope<T[]>>;
  searchParam?: 'search' | 'q';
  onItemPress?: (item: T) => void;
  itemTitle: (item: T) => string;
  itemSubtitle?: (item: T) => string | undefined;
  itemMeta?: (item: T) => string | undefined;
  itemMetric?: (item: T) => string | undefined;
  itemBadge?: (item: T) => Badge | undefined;
  emptyTitle?: string;
  emptyCtaLabel?: string;
  onEmptyCta?: () => void;
  params?: ListParams;
  headerRight?: React.ReactNode;
  noHeader?: boolean;
  onBack?: () => void;
  moduleIcon?: ModuleIconKey;
  heroEyebrow?: string;
  heroCompact?: boolean;
  heroStats?: { label: string; value: string | number }[];
  fab?: { onPress: () => void; label?: string };
  swipeActions?: (item: T) => { edit?: () => void; delete?: () => void };
};

export function ListScreenTemplate<T extends Record<string, unknown>>({
  title,
  subtitle,
  loader,
  searchParam = 'search',
  onItemPress,
  itemTitle,
  itemSubtitle,
  itemMeta,
  itemMetric,
  itemBadge,
  emptyTitle,
  emptyCtaLabel,
  onEmptyCta,
  params,
  headerRight,
  noHeader,
  onBack,
  moduleIcon,
  heroEyebrow,
  heroCompact = true,
  heroStats,
  fab,
  swipeActions,
}: Props<T>) {
  const c = useColors();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const listParams = useMemo(
    () => ({ ...(params ?? {}), ...(debounced ? { [searchParam]: debounced } : {}) }),
    [debounced, params, searchParam],
  );
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<T>(loader, listParams);
  const stats = heroStats ?? [{ label: 'العناصر', value: items.length }];

  return (
    <ListScreenLayout
      title={title}
      subtitle={subtitle}
      noHeader={noHeader ?? true}
      onBack={onBack}
      headerRight={headerRight}
      searchValue={query}
      onSearchChange={setQuery}
      onRefresh={refresh}
      refreshing={refreshing}
      fab={fab}
      hero={{
        eyebrow: heroEyebrow ?? defaultHeroEyebrow(moduleIcon),
        title,
        subtitle,
        stats,
        compact: heroCompact,
      }}
    >
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle={emptyTitle}
        emptyCtaLabel={emptyCtaLabel}
        onEmptyCta={onEmptyCta}
        keyExtractor={(item, index) => {
          const id = item.id;
          return id != null && id !== '' ? `row-${String(id)}-${index}` : `row-idx-${index}`;
        }}
        renderItem={({ item }) => {
          const badge = itemBadge?.(item);
          const metric = itemMetric?.(item) ?? itemMeta?.(item);
          const meta = itemMetric ? itemMeta?.(item) : undefined;
          const row = (
            <DenseRow
              height={rowHeight.operational}
              primary={itemTitle(item)}
              secondary={itemSubtitle?.(item)}
              meta={meta}
              status={badge ? <AppBadge label={badge.label} tone={badge.tone} /> : undefined}
              trailing={
                metric ? (
                  <AppText numeric translate={false} style={[textStyle('rowPrimary'), { color: c.text }]} numberOfLines={1}>
                    {metric}
                  </AppText>
                ) : undefined
              }
              onPress={onItemPress ? () => onItemPress(item) : undefined}
            />
          );
          const swipe = swipeActions?.(item);
          if (!swipe?.edit && !swipe?.delete) return row;
          const actions = [
            swipe.edit ? { label: 'تعديل', icon: 'edit' as const, onPress: swipe.edit } : null,
            swipe.delete ? { label: 'حذف', icon: 'delete' as const, tone: 'danger' as const, onPress: swipe.delete } : null,
          ].filter(Boolean) as { label: string; icon: 'edit' | 'delete'; tone?: 'danger'; onPress: () => void }[];
          return <AppSwipeRow rightActions={actions}>{row}</AppSwipeRow>;
        }}
      />
    </ListScreenLayout>
  );
}
