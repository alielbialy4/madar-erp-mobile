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
import { dateText, money, numberText } from '@/utils/format';
import { inventoryDocumentReference, inventoryStatusLabel } from '@/utils/inventoryLabels';

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

export function docRowTitle(row: Record<string, unknown>, fallback = '—'): string {
  return inventoryDocumentReference(row, fallback);
}

export function docRowSubtitle(row: Record<string, unknown>): string {
  const warehouse = row.warehouse as Record<string, unknown> | undefined;
  const branch = row.branch as Record<string, unknown> | undefined;
  return [
    row.warehouse_name ?? warehouse?.name,
    row.branch_name ?? branch?.name,
    row.created_at ? dateText(String(row.created_at)) : undefined,
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join(' • ');
}

export function docRowMeta(row: Record<string, unknown>): string | undefined {
  if (row.total != null) return money(row.total);
  if (row.variance_total != null) return `فرق ${numberText(row.variance_total)}`;
  if (row.items_count != null) return `${numberText(row.items_count)} صنف`;
  return undefined;
}
