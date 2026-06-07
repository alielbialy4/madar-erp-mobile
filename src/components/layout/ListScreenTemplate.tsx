import React, { useMemo, useState } from 'react';
import type { ApiEnvelope, ListParams } from '@/types/api';
import { ListScreenLayout } from '@/components/layout/ListScreenLayout';
import { AppDomainCard } from '@/components/ui/AppDomainCard';
import { AppSwipeRow } from '@/components/ui/AppSwipeRow';
import { AppFAB } from '@/components/ui/AppFAB';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { moduleIcons, type ModuleIconKey } from '@/constants/iconMap';

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
  heroStats?: Array<{ label: string; value: string | number }>;
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
  heroStats,
  fab,
  swipeActions,
}: Props<T>) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const listParams = useMemo(() => ({ ...(params ?? {}), ...(debounced ? { [searchParam]: debounced } : {}) }), [debounced, params, searchParam]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<T>(loader, listParams);

  const stats = heroStats ?? [{ label: 'العناصر', value: items.length }];

  return (
    <ListScreenLayout
      title={title}
      subtitle={subtitle}
      noHeader={noHeader}
      onBack={onBack}
      headerRight={headerRight}
      searchValue={query}
      onSearchChange={setQuery}
      onRefresh={refresh}
      refreshing={refreshing}
      fab={fab}
      hero={{
        eyebrow: heroEyebrow ?? subtitle,
        title,
        subtitle,
        stats,
        compact: false,
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
          const card = (
            <AppDomainCard
              title={itemTitle(item)}
              subtitle={itemSubtitle?.(item)}
              meta={itemMeta?.(item)}
              metric={itemMetric?.(item)}
              badgeLabel={badge?.label}
              badgeTone={badge?.tone}
              leadingIcon={moduleIcon ? moduleIcons[moduleIcon] : undefined}
              onPress={onItemPress ? () => onItemPress(item) : undefined}
            />
          );
          const swipe = swipeActions?.(item);
          if (!swipe?.edit && !swipe?.delete) return card;
          const actions = [
            swipe.edit ? { label: 'تعديل', icon: 'edit' as const, onPress: swipe.edit } : null,
            swipe.delete ? { label: 'حذف', icon: 'delete' as const, tone: 'danger' as const, onPress: swipe.delete } : null,
          ].filter(Boolean) as Array<{ label: string; icon: 'edit' | 'delete'; tone?: 'danger'; onPress: () => void }>;
          return <AppSwipeRow rightActions={actions}>{card}</AppSwipeRow>;
        }}
      />
    </ListScreenLayout>
  );
}
