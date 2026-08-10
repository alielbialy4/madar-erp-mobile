import { dateText, money, numberText } from '@/utils/format';
import { inventoryDocumentReference } from '@/utils/inventoryLabels';

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
