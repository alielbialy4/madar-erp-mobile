import React from 'react';
import { AppBadge } from '@/components/ui';
import type { DashboardTableColumn } from '@/components/dashboard/DashboardDataTable';
import type { InventoryListSurface } from '@/components/inventory/inventoryListPresets';
import { docRowMeta, docRowSubtitle, docRowTitle } from '@/components/inventory/inventoryDocRow';
import { asText, dateText, numberText } from '@/utils/format';

export type InventoryTableConfig = {
  columns: DashboardTableColumn[];
  mapRow: (row: Record<string, unknown>) => Record<string, React.ReactNode>;
  minWidth?: number;
};

export function getInventoryTableConfig(surface: InventoryListSurface): InventoryTableConfig | null {
  switch (surface) {
    case 'warehouses':
      return {
        minWidth: 680,
        columns: [
          { key: 'name', label: 'المخزن', flex: 2 },
          { key: 'code', label: 'الكود', width: 88 },
          { key: 'branch', label: 'الفرع', flex: 1.2 },
          { key: 'products', label: 'أصناف', align: 'end', width: 64 },
          { key: 'status', label: 'الحالة', width: 88 },
        ],
        mapRow: (row) => {
          const active = row.status !== 'inactive';
          const branch = row.branch as Record<string, unknown> | undefined;
          return {
            name: asText(row.name, '—'),
            code: asText(row.code, '—'),
            branch: asText(branch?.name, '—'),
            products: numberText(row.products_count ?? 0),
            status: <AppBadge label={active ? 'نشط' : 'غير نشط'} tone={active ? 'success' : 'warning'} />,
          };
        },
      };
    case 'balances':
      return {
        minWidth: 720,
        columns: [
          { key: 'product', label: 'المنتج', flex: 2 },
          { key: 'warehouse', label: 'المخزن', flex: 1.2 },
          { key: 'qty', label: 'الكمية', align: 'end', width: 72 },
          { key: 'category', label: 'التصنيف', flex: 1 },
          { key: 'status', label: 'الحالة', width: 88 },
        ],
        mapRow: (row) => {
          const qty = Number(row.quantity ?? 0);
          const product = row.product as Record<string, unknown> | undefined;
          return {
            product: asText(row.product_name ?? product?.name, '—'),
            warehouse: asText(row.warehouse_name ?? (row.warehouse as Record<string, unknown> | undefined)?.name, '—'),
            qty: numberText(qty),
            category: asText(row.category_name, '—'),
            status: (
              <AppBadge
                label={asText(row.balance_status_label_ar, qty <= 0 ? 'نفد' : 'متوفر')}
                tone={qty <= 0 ? 'danger' : 'success'}
              />
            ),
          };
        },
      };
    case 'movements':
      return {
        minWidth: 760,
        columns: [
          { key: 'product', label: 'المنتج', flex: 1.6 },
          { key: 'type', label: 'النوع', width: 96 },
          { key: 'warehouse', label: 'المخزن', flex: 1.2 },
          { key: 'delta', label: 'التغير', align: 'end', width: 72 },
          { key: 'date', label: 'التاريخ', flex: 1 },
        ],
        mapRow: (row) => ({
          product: asText(row.product_name ?? (row.product as Record<string, unknown> | undefined)?.name, '—'),
          type: asText(row.movement_type_label_ar ?? row.movement_type, '—'),
          warehouse: asText(row.warehouse_name, '—'),
          delta: numberText(row.delta ?? row.quantity ?? 0),
          date: row.occurred_at ? dateText(String(row.occurred_at)) : '—',
        }),
      };
    case 'expiry':
      return {
        minWidth: 700,
        columns: [
          { key: 'product', label: 'المنتج', flex: 1.6 },
          { key: 'batch', label: 'الدفعة', width: 96 },
          { key: 'warehouse', label: 'المخزن', flex: 1.2 },
          { key: 'days', label: 'متبقي', align: 'end', width: 72 },
          { key: 'status', label: 'الحالة', width: 88 },
        ],
        mapRow: (row) => {
          const days = Number(row.days_to_expiry ?? 0);
          const expired = row.status === 'expired' || days < 0;
          return {
            product: asText(row.product_name, '—'),
            batch: asText(row.batch_number, '—'),
            warehouse: asText(row.warehouse_name, '—'),
            days: expired ? 'منتهي' : numberText(days),
            status: (
              <AppBadge label={expired ? 'منتهي' : 'تنبيه'} tone={expired ? 'danger' : 'warning'} />
            ),
          };
        },
      };
    case 'products':
      return {
        minWidth: 680,
        columns: [
          { key: 'product', label: 'المنتج', flex: 2 },
          { key: 'barcode', label: 'الباركود', width: 120 },
          { key: 'warehouse', label: 'المخزن', flex: 1.2 },
          { key: 'qty', label: 'الكمية', align: 'end', width: 72 },
          { key: 'status', label: 'الحالة', width: 88 },
        ],
        mapRow: (row) => {
          const status = String(row.status ?? '');
          const qty = Number(row.quantity ?? 0);
          return {
            product: asText(row.name ?? row.product_name, '—'),
            barcode: asText(row.barcode, '—'),
            warehouse: asText(row.warehouse_name, '—'),
            qty: numberText(qty),
            status: (
              <AppBadge
                label={status === 'out' ? 'نفد' : status === 'low' ? 'منخفض' : 'متوفر'}
                tone={status === 'out' ? 'danger' : status === 'low' ? 'warning' : 'success'}
              />
            ),
          };
        },
      };
    case 'transfers':
      return docTableConfig('تحويل', (row) => ({
        title: `${asText(row.from_warehouse_name, 'من')} → ${asText(row.to_warehouse_name, 'إلى')}`,
        badgeTone: row.status === 'completed' ? 'success' : 'info',
      }));
    case 'adjustments':
      return docTableConfig('تسوية', (row) => ({
        title: docRowTitle(row, 'تسوية'),
        badgeTone: row.status === 'posted' ? 'success' : 'warning',
      }));
    case 'stockCounts':
      return docTableConfig('جرد', (row) => ({
        title: docRowTitle(row, 'جرد'),
        badgeTone: row.status === 'posted' ? 'success' : 'warning',
      }));
    case 'reorderRules':
      return {
        minWidth: 620,
        columns: [
          { key: 'product', label: 'المنتج', flex: 2 },
          { key: 'threshold', label: 'الحد', align: 'end', width: 72 },
          { key: 'reorder_to', label: 'إعادة إلى', align: 'end', width: 88 },
          { key: 'status', label: 'الحالة', width: 88 },
        ],
        mapRow: (row) => {
          const product = row.product as Record<string, unknown> | undefined;
          const active = row.is_active !== false;
          return {
            product: asText(row.product_name ?? product?.name, '—'),
            threshold: numberText(row.threshold),
            reorder_to: numberText(row.reorder_to),
            status: <AppBadge label={active ? 'نشط' : 'معطّل'} tone={active ? 'success' : 'warning'} />,
          };
        },
      };
    case 'requisitions':
      return docTableConfig('طلب', (row) => ({
        title: docRowTitle(row, 'طلب'),
        badgeTone: 'info',
      }));
    default:
      return null;
  }
}

function docTableConfig(
  fallback: string,
  extra?: (row: Record<string, unknown>) => { title?: string; badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info' },
): InventoryTableConfig {
  return {
    minWidth: 640,
    columns: [
      { key: 'ref', label: 'المرجع', flex: 1.4 },
      { key: 'detail', label: 'التفاصيل', flex: 2 },
      { key: 'meta', label: 'القيمة', align: 'end', width: 88 },
      { key: 'status', label: 'الحالة', width: 96 },
    ],
    mapRow: (row) => {
      const tone = extra?.(row).badgeTone ?? 'default';
      return {
        ref: extra?.(row).title ?? docRowTitle(row, fallback),
        detail: docRowSubtitle(row),
        meta: docRowMeta(row) ?? '—',
        status: <AppBadge label={String(row.status_label_ar ?? row.status ?? '—')} tone={tone} />,
      };
    },
  };
}
