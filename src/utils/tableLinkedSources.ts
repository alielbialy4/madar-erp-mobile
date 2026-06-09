import type { MergedTableSource } from '@/components/pos/TablePosCard';

export function collectLinkedTableSources(
  table: {
    id: string;
    linked_table_sources?: MergedTableSource[] | null;
    current_order?: { merged_table_sources?: MergedTableSource[] | null } | null;
  },
  optimistic: MergedTableSource[] = [],
): MergedTableSource[] {
  const map = new Map<string, MergedTableSource>();

  const add = (entry: MergedTableSource | null | undefined) => {
    if (!entry?.id || entry.id === table.id) return;
    map.set(entry.id, entry);
  };

  for (const entry of table.linked_table_sources ?? []) add(entry);
  for (const entry of table.current_order?.merged_table_sources ?? []) add(entry);
  for (const entry of optimistic) add(entry);

  return Array.from(map.values());
}

export function buildGroupedTableTitle(primaryName: string, linked: MergedTableSource[]): string {
  if (linked.length === 0) return primaryName;
  return [primaryName, ...linked.map((l) => l.name)].join(' + ');
}

export function sumGroupedCapacity(primaryCapacity: number, linked: MergedTableSource[]): number {
  return primaryCapacity + linked.reduce((sum, l) => sum + Number(l.capacity ?? 0), 0);
}
