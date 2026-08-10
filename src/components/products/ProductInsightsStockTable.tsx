import React, { useMemo } from 'react';
import { AppBadge } from '@/components/ui';
import { DashboardDataTable } from '@/components/dashboard/DashboardDataTable';
import { dateText, numberText } from '@/utils/format';
import { stockStatusLabel, stockStatusTone } from './productInsightsUtils';
import type { InsightsBranchStockRow, InsightsWarehouseStockRow } from '@/types/productInsights';

type Props =
  | { variant: 'branch'; rows: InsightsBranchStockRow[] }
  | { variant: 'warehouse'; rows: InsightsWarehouseStockRow[]; showBranchColumn?: boolean };

function BranchStockTable({ rows }: { rows: InsightsBranchStockRow[] }) {
  const columns = useMemo(
    () => [
      { key: 'branch', label: 'الفرع', flex: 2 },
      { key: 'qty', label: 'وحدة', align: 'end' as const, width: 72 },
      { key: 'warehouses', label: 'مخازن', align: 'end' as const, width: 64 },
      { key: 'last', label: 'آخر حركة', flex: 1.2 },
      { key: 'status', label: 'الحالة', width: 80 },
    ],
    [],
  );

  const tableRows = useMemo(
    () =>
      rows.map((row) => ({
        branch: row.branch_name ?? '—',
        qty: numberText(row.quantity),
        warehouses: numberText(row.warehouses_count),
        last: row.last_movement_at ? dateText(row.last_movement_at) : '—',
        status: <AppBadge label={stockStatusLabel(row.status)} tone={stockStatusTone(row.status)} />,
      })),
    [rows],
  );

  return (
    <DashboardDataTable
      title="مخزون الفروع"
      hint="الأرقام = وحدات مخزنية حالية لكل فرع"
      columns={columns}
      rows={tableRows}
      emptyMessage="لا توجد بيانات فرع"
    />
  );
}

function WarehouseStockTable({
  rows,
  showBranchColumn,
}: {
  rows: InsightsWarehouseStockRow[];
  showBranchColumn?: boolean;
}) {
  const columns = useMemo(() => {
    const base: {
      key: string;
      label: string;
      flex?: number;
      width?: number;
      align?: 'start' | 'center' | 'end';
    }[] = [
      { key: 'warehouse', label: 'المخزن', flex: 2 },
      { key: 'code', label: 'الكود', width: 72 },
    ];
    if (showBranchColumn) base.push({ key: 'branch', label: 'الفرع', flex: 1.2 });
    base.push(
      { key: 'qty', label: 'وحدة', align: 'end', width: 72 },
      { key: 'last', label: 'آخر حركة', flex: 1.2 },
      { key: 'status', label: 'الحالة', width: 80 },
    );
    return base;
  }, [showBranchColumn]);

  const tableRows = useMemo(
    () =>
      rows.map((row) => {
        const entry: Record<string, React.ReactNode> = {
          warehouse: row.warehouse_name,
          code: row.warehouse_code ?? '—',
          qty: numberText(row.quantity),
          last: row.last_movement_at ? dateText(row.last_movement_at) : '—',
          status: <AppBadge label={stockStatusLabel(row.status)} tone={stockStatusTone(row.status)} />,
        };
        if (showBranchColumn) entry.branch = row.branch_name ?? '—';
        return entry;
      }),
    [rows, showBranchColumn],
  );

  return (
    <DashboardDataTable
      title="مخزون المخازن"
      hint="الأرقام = وحدات مخزنية حالية لكل مخزن"
      columns={columns}
      rows={tableRows}
      emptyMessage="لا توجد بيانات مخزن"
    />
  );
}

export function ProductInsightsStockTable(props: Props) {
  if (props.variant === 'branch') {
    return <BranchStockTable rows={props.rows} />;
  }
  return <WarehouseStockTable rows={props.rows} showBranchColumn={props.showBranchColumn} />;
}
