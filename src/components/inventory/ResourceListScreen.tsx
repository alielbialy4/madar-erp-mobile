import React, { useCallback, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { InventoryHero } from '@/components/inventory/InventoryHero';
import { InventoryListShell } from '@/components/inventory/InventoryListShell';
import type { InventoryTableConfig } from '@/components/inventory/inventoryTableConfig';
import { DOC_LIST_SURFACES } from '@/components/inventory/inventoryListPresets';
import type { InventoryListSurface } from '@/components/inventory/inventoryListPresets';
import type { ApiEnvelope, ListParams } from '@/types/api';
import { AppBadge } from '@/components/ui';
import { inventoryStatusLabel } from '@/utils/inventoryLabels';

export { docRowMeta, docRowSubtitle, docRowTitle } from '@/components/inventory/inventoryDocRow';

type Props = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  surface?: InventoryListSurface;
  loader: (params: ListParams) => Promise<ApiEnvelope<Record<string, unknown>[]>>;
  searchParam?: 'search' | 'q';
  searchEnabled?: boolean;
  extraParams?: Record<string, unknown>;
  onBack: () => void;
  onItemPress?: (item: Record<string, unknown>) => void;
  headerAction?: { label: string; onPress: () => void };
  mapRow: (row: Record<string, unknown>) => {
    title: string;
    subtitle: string;
    meta?: string;
    badgeLabel?: string;
    badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  };
  emptyTitle: string;
  emptyMessage?: string;
};

export function ResourceListScreen({
  title,
  subtitle,
  eyebrow = 'المخزون',
  surface = 'stockCounts',
  loader,
  searchParam,
  searchEnabled,
  extraParams,
  onBack,
  onItemPress,
  headerAction,
  mapRow,
  emptyTitle,
  emptyMessage,
}: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const [listItems, setListItems] = useState<Record<string, unknown>[]>([]);
  const [refreshingHero, setRefreshingHero] = useState(false);
  const [shellKey, setShellKey] = useState(0);

  const tableConfigOverride = useMemo<InventoryTableConfig>(() => ({
    columns: [
      { key: 'ref', label: 'العنصر', flex: 1.4 },
      { key: 'detail', label: 'التفاصيل', flex: 2 },
      { key: 'meta', label: 'البيان', align: 'end', width: 88 },
      { key: 'status', label: 'الحالة', width: 96 },
    ],
    mapRow: (row) => {
      const mapped = mapRow(row);
      return {
        ref: mapped.title,
        detail: mapped.subtitle || '—',
        meta: mapped.meta || '—',
        status: mapped.badgeLabel ? (
          <AppBadge
            label={inventoryStatusLabel(mapped.badgeLabel)}
            tone={mapped.badgeTone ?? 'default'}
          />
        ) : '—',
      };
    },
  }), [mapRow]);

  const docSurface = surface in DOC_LIST_SURFACES ? DOC_LIST_SURFACES[surface as 'transfers' | 'adjustments'] : null;
  const resolvedSearchParam = searchParam ?? docSurface?.searchParam ?? 'search';
  const resolvedSearchEnabled =
    searchEnabled ?? (surface === 'stockCounts' || surface === 'transfers' || surface === 'adjustments');
  const supportedFilters =
    docSurface?.supportedFilters ??
    (surface === 'stockCounts'
      ? ['status', 'warehouse_id', 'date_from', 'date_to']
      : surface === 'reorderRules'
        ? ['branch_id']
        : surface === 'requisitions'
          ? ['status']
          : []);

  const hero = (
    <InventoryHero
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      stats={[{ label: 'العناصر', value: listItems.length }]}
      metaLabel={`${listItems.length} عنصر`}
      isLoading={refreshingHero}
      onRefresh={() => {
        setRefreshingHero(true);
        setShellKey((k) => k + 1);
        setTimeout(() => setRefreshingHero(false), 400);
      }}
      statsOnly={!isTablet}
      compact
    />
  );

  const listLoader = useCallback(
    (params: ListParams) => loader({ ...extraParams, ...params }),
    [loader, extraParams],
  );

  return (
    <InventoryListShell
      key={`resource-${surface}-${shellKey}`}
      title={title}
      onBack={onBack}
      surface={surface}
      loader={listLoader}
      searchParam={resolvedSearchParam}
      searchEnabled={resolvedSearchEnabled}
      supportedFilters={supportedFilters}
      defaultParams={extraParams}
      listHeader={hero}
      canManage={Boolean(headerAction)}
      onAdd={headerAction?.onPress}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      onItemsChange={setListItems}
      layout="table"
      tableConfigOverride={tableConfigOverride}
      onItemPress={onItemPress}
    />
  );
}

