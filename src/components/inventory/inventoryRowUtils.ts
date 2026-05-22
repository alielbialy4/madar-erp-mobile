import { asText, dateText, money, numberText } from '@/utils/format';
import type { InventoryListPresetKey } from '@/types/navigation';

export type InventoryCardModel = {
  title: string;
  subtitle: string;
  meta?: string;
  badgeLabel?: string;
  badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
};

export function mapInventoryRow(preset: InventoryListPresetKey, row: Record<string, unknown>): InventoryCardModel {
  switch (preset) {
    case 'balances': {
      const qty = Number(row.quantity ?? 0);
      const product = row.product as Record<string, unknown> | undefined;
      return {
        title: asText(row.product_name ?? product?.name ?? row.name, 'منتج'),
        subtitle: [row.warehouse_name, (row.warehouse as Record<string, unknown> | undefined)?.name, row.branch_name]
          .filter(Boolean)
          .join(' • ') || 'مخزن',
        meta: `الكمية: ${numberText(qty)}${row.category_name ? ` • ${row.category_name}` : ''}`,
        badgeLabel: asText(row.balance_status_label_ar, qty <= 0 ? 'نفد' : 'رصيد'),
        badgeTone: qty <= 0 ? 'danger' : 'success',
      };
    }
    case 'warehouses': {
      const branch = row.branch as Record<string, unknown> | undefined;
      return {
        title: asText(row.name, 'مخزن'),
        subtitle: [branch?.name, row.code].filter(Boolean).join(' • ') || '—',
        meta: row.status ? `الحالة: ${asText(row.status)}` : undefined,
        badgeLabel: row.is_active === false ? 'غير نشط' : 'نشط',
        badgeTone: row.is_active === false ? 'warning' : 'success',
      };
    }
    case 'movements':
      return {
        title: asText(row.product_name ?? row.movement_type_label ?? row.movement_type, 'حركة'),
        subtitle: [
          row.warehouse_name,
          row.occurred_at ? dateText(String(row.occurred_at)) : undefined,
        ]
          .filter(Boolean)
          .join(' • '),
        meta: `التغير: ${numberText(row.delta ?? row.quantity ?? 0)}`,
        badgeLabel: asText(row.movement_type ?? row.type, 'حركة'),
        badgeTone: 'info',
      };
    case 'expiry': {
      const days = Number(row.days_to_expiry ?? 0);
      const expired = row.status === 'expired' || days < 0;
      return {
        title: asText(row.product_name, 'منتج'),
        subtitle: `${asText(row.warehouse_name, 'مخزن')} • دفعة ${asText(row.batch_number, '—')}`,
        meta: expired ? 'منتهية' : `متبقي ${numberText(days)} يوم`,
        badgeLabel: asText(row.status, expired ? 'منتهي' : 'تنبيه'),
        badgeTone: expired ? 'danger' : 'warning',
      };
    }
    default:
      return {
        title: asText(
          row.name ?? row.title ?? row.reference_no ?? row.code ?? row.product_name ?? row.id,
          'عنصر',
        ),
        subtitle: [
          row.status_label_ar,
          row.status,
          row.warehouse_name,
          row.branch_name,
          row.created_at ? dateText(String(row.created_at)) : undefined,
        ]
          .filter(Boolean)
          .slice(0, 2)
          .join(' • '),
        meta: rowMetaGeneric(row),
        badgeLabel: row.status ? asText(row.status) : undefined,
        badgeTone: 'default',
      };
  }
}

function rowMetaGeneric(row: Record<string, unknown>): string | undefined {
  const amount = row.total ?? row.amount ?? row.balance;
  if (amount != null) return money(amount);
  const count = row.items_count ?? row.products_count;
  if (count != null) return `${count} عنصر`;
  return undefined;
}
