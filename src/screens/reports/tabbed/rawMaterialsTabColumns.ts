import type { ReportColumnDef } from './ReportTableSection';
import { barcodeMeta, moneyMeta, numMeta, textMeta } from '@/utils/reportCells';

export type RawMaterialsTab = 'stock' | 'low' | 'expiry' | 'purchases';

const dash = (v: unknown) => textMeta(v);

export function rawMaterialsColumns(tab: RawMaterialsTab): ReportColumnDef[] {
  if (tab === 'expiry') {
    return [
      { key: 'name', label: 'الخامة' },
      { key: 'product_role', label: 'النوع', render: dash },
      { key: 'batch_number', label: 'الدفعة', render: dash },
      { key: 'expiry_date', label: 'الانتهاء', render: dash },
      { key: 'stock_quantity', label: 'الرصيد', align: 'end', render: (v) => numMeta(v) },
    ];
  }
  if (tab === 'purchases') {
    return [
      { key: 'raw_material', label: 'الخامة' },
      { key: 'product_role', label: 'النوع', render: dash },
      { key: 'supplier', label: 'المورد', render: dash },
      { key: 'purchased_qty', label: 'الكمية المشتراة', align: 'end', render: (v) => numMeta(v) },
      { key: 'total_cost', label: 'إجمالي التكلفة', align: 'end', render: (v) => moneyMeta(v) },
      { key: 'last_purchase_date', label: 'آخر شراء', render: dash },
    ];
  }
  if (tab === 'low') {
    return [
      { key: 'name', label: 'الخامة' },
      { key: 'stock_quantity', label: 'الرصيد', align: 'end', render: (v) => numMeta(v) },
      { key: 'min_stock_alert', label: 'حد التنبيه', align: 'end', render: (v) => numMeta(v) },
      { key: 'preferred_supplier', label: 'المورد', render: dash },
    ];
  }
  return [
    { key: 'name', label: 'الخامة' },
    { key: 'barcode', label: 'الباركود', render: (v) => barcodeMeta(v) },
    { key: 'product_role', label: 'النوع', render: dash },
    { key: 'unit', label: 'الوحدة', render: dash },
    { key: 'stock_quantity', label: 'الرصيد', align: 'end', render: (v) => numMeta(v) },
    { key: 'min_stock_alert', label: 'حد التنبيه', align: 'end', render: (v) => numMeta(v) },
    { key: 'stock_value', label: 'القيمة', align: 'end', render: (v) => moneyMeta(v) },
    { key: 'preferred_supplier', label: 'المورد', render: dash },
  ];
}

export function rawMaterialsKpis(tab: RawMaterialsTab) {
  if (tab === 'low') {
    return [
      { key: 'low_count', label: 'خامات منخفضة', format: 'number' as const, tone: 'warning' as const },
      { key: 'total_deficit_qty', label: 'إجمالي العجز', format: 'number' as const },
    ];
  }
  if (tab === 'expiry') {
    return [
      { key: 'expired_count', label: 'منتهية', format: 'number' as const, tone: 'danger' as const },
      { key: 'near_expiry_count', label: 'قريبة الانتهاء', format: 'number' as const, tone: 'warning' as const },
      { key: 'total_qty', label: 'إجمالي الكمية', format: 'number' as const },
    ];
  }
  if (tab === 'purchases') {
    return [
      { key: 'total_purchased_qty', label: 'الكمية المشتراة', format: 'number' as const },
      { key: 'total_cost', label: 'إجمالي التكلفة', format: 'money' as const, tone: 'primary' as const },
      { key: 'supplier_count', label: 'عدد الموردين', format: 'number' as const },
    ];
  }
  return [
    { key: 'item_count', label: 'عدد الخامات', format: 'number' as const },
    { key: 'total_qty', label: 'إجمالي الكمية', format: 'number' as const },
    { key: 'total_value', label: 'إجمالي القيمة', format: 'money' as const, tone: 'primary' as const },
  ];
}

export function rawMaterialsEmptyMessage(tab: RawMaterialsTab): string {
  if (tab === 'low') return 'لا توجد خامات منخفضة المخزون.';
  if (tab === 'expiry') return 'لا توجد دفعات خامات مطابقة.';
  if (tab === 'purchases') return 'لا توجد مشتريات خامات في الفترة المحددة.';
  return 'لا توجد خامات مطابقة للفلاتر.';
}

export const RAW_MATERIALS_TABS: { id: RawMaterialsTab; label: string }[] = [
  { id: 'stock', label: 'المخزون' },
  { id: 'low', label: 'منخفض' },
  { id: 'expiry', label: 'الصلاحية' },
  { id: 'purchases', label: 'المشتريات' },
];
