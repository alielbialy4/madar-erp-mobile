import React from 'react';
import { View } from 'react-native';
import type { ReportColumnDef } from './ReportTableSection';
import { AppBadge, AppText } from '@/components/ui';
import { barcodeMeta, countMeta, moneyMeta, numMeta, pctMeta, textMeta } from '@/utils/reportCells';
import { flexRow, textLtr } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

export type RecipesTab = 'consumption' | 'cost' | 'missing' | 'negative' | 'variance' | 'finished_goods';

const dash = (v: unknown) => textMeta(v);

function VarianceCell({ value }: { value: unknown }) {
  const c = useColors();
  const n = Number(value);
  const color = Number.isFinite(n) && n > 0 ? c.danger : c.success;
  const text = Number.isFinite(n)
    ? n.toLocaleString('ar-EG-u-nu-latn', { maximumFractionDigits: 4 })
    : '0';
  return <AppText style={[textLtr, { color, fontFamily: 'monospace' }]}>{text}</AppText>;
}

function VariantsCell({ row }: { row: Record<string, unknown> }) {
  const variants = Array.isArray(row.variants) ? row.variants.length : 0;
  const mods = Array.isArray(row.modifiers) ? row.modifiers.length : 0;
  if (!variants && !mods) return textMeta('—');
  return (
    <View style={{ ...flexRow, gap: spacing.xs, flexWrap: 'wrap' }}>
      {variants ? <AppBadge label={`${variants} حجم`} tone="info" /> : null}
      {mods ? <AppBadge label={`${mods} إضافة`} tone="info" /> : null}
    </View>
  );
}

export function recipesColumns(tab: RecipesTab): ReportColumnDef[] {
  if (tab === 'consumption') {
    return [
      { key: 'ingredient', label: 'المكوّن' },
      { key: 'unit', label: 'الوحدة', render: dash },
      { key: 'warehouse_name', label: 'المستودع', render: dash },
      { key: 'consumed_qty', label: 'الكمية المستهلكة', align: 'end', render: (v) => numMeta(v) },
      { key: 'cost', label: 'التكلفة', align: 'end', render: (v) => moneyMeta(v) },
    ];
  }
  if (tab === 'cost') {
    return [
      { key: 'product', label: 'المنتج' },
      { key: 'recipe_cost', label: 'تكلفة الوصفة', align: 'end', render: (v) => moneyMeta(v) },
      { key: 'sale_price', label: 'سعر البيع', align: 'end', render: (v) => moneyMeta(v) },
      { key: 'gross_margin', label: 'هامش الربح', align: 'end', render: (v) => moneyMeta(v) },
      { key: 'margin_percentage', label: 'نسبة الهامش', align: 'end', render: (v) => pctMeta(v, 1) },
      { key: 'variants', label: 'الأحجام/الإضافات', render: (_v, row) => <VariantsCell row={row} /> },
    ];
  }
  if (tab === 'missing') {
    return [
      { key: 'name', label: 'المنتج', render: (v, row) => dash(v ?? row.product) },
      { key: 'barcode', label: 'الباركود', render: (v) => barcodeMeta(v) },
    ];
  }
  if (tab === 'negative') {
    return [
      { key: 'ingredient', label: 'المكوّن' },
      { key: 'unit', label: 'الوحدة', render: dash },
      { key: 'stock_quantity', label: 'الرصيد', align: 'end', render: (v) => numMeta(v) },
      { key: 'used_by_products', label: 'مستخدم في', align: 'end', render: (v) => countMeta(v) },
    ];
  }
  if (tab === 'finished_goods') {
    return [
      { key: 'product', label: 'المنتج' },
      { key: 'ingredient', label: 'المكوّن' },
      { key: 'unit', label: 'الوحدة', render: dash },
      { key: 'consumed_qty', label: 'الكمية المستهلكة', align: 'end', render: (v) => numMeta(v) },
      { key: 'cost', label: 'التكلفة', align: 'end', render: (v) => moneyMeta(v) },
    ];
  }
  return [
    { key: 'ingredient', label: 'المكوّن' },
    { key: 'unit', label: 'الوحدة', render: dash },
    { key: 'expected_qty', label: 'المتوقع', align: 'end', render: (v) => numMeta(v) },
    { key: 'actual_qty', label: 'الفعلي', align: 'end', render: (v) => numMeta(v) },
    { key: 'variance_qty', label: 'الفرق', align: 'end', render: (v) => <VarianceCell value={v} /> },
    { key: 'variance_pct', label: 'نسبة الفرق', align: 'end', render: (v) => pctMeta(v, 1) },
  ];
}

export function recipesKpis(tab: RecipesTab) {
  if (tab === 'consumption') {
    return [
      { key: 'total_consumed_qty', label: 'إجمالي الاستهلاك', format: 'number' as const },
      { key: 'total_cost', label: 'إجمالي التكلفة', format: 'money' as const, tone: 'primary' as const },
      { key: 'ingredient_count', label: 'عدد المكوّنات', format: 'number' as const },
    ];
  }
  if (tab === 'cost') {
    return [
      { key: 'product_count', label: 'عدد المنتجات', format: 'number' as const },
      { key: 'avg_margin_pct', label: 'متوسط الهامش', format: 'percent' as const },
      { key: 'total_recipe_cost', label: 'إجمالي تكلفة الوصفات', format: 'money' as const, tone: 'primary' as const },
    ];
  }
  if (tab === 'variance') {
    return [
      { key: 'ingredient_count', label: 'عدد المكوّنات', format: 'number' as const },
      { key: 'total_variance_qty', label: 'إجمالي الفرق', format: 'number' as const, tone: 'warning' as const },
    ];
  }
  if (tab === 'finished_goods') {
    return [
      { key: 'product_count', label: 'عدد المنتجات', format: 'number' as const },
      { key: 'total_consumed_qty', label: 'إجمالي الاستهلاك', format: 'number' as const },
      { key: 'total_cost', label: 'إجمالي التكلفة', format: 'money' as const, tone: 'primary' as const },
    ];
  }
  return [];
}

export function recipesEmptyMessage(tab: RecipesTab): string {
  switch (tab) {
    case 'missing':
      return 'لا توجد منتجات بوصفة بدون مكونات.';
    case 'negative':
      return 'لا توجد خامات بأرصدة سالبة في هذا الفرع.';
    case 'variance':
      return 'لا توجد فروقات مطابقة للفترة المحددة.';
    case 'cost':
      return 'لا توجد منتجات بوصفة.';
    case 'finished_goods':
      return 'لا توجد منتجات تامة مطابقة للفترة.';
    default:
      return 'لا توجد نتائج مطابقة للفلاتر المحددة.';
  }
}

export const RECIPES_TABS: { id: RecipesTab; label: string }[] = [
  { id: 'consumption', label: 'الاستهلاك' },
  { id: 'cost', label: 'التكلفة والهامش' },
  { id: 'missing', label: 'وصفات ناقصة' },
  { id: 'negative', label: 'مكونات سالبة' },
  { id: 'variance', label: 'المتوقع مقابل الفعلي' },
  { id: 'finished_goods', label: 'منتجات تامة' },
];

export const RECIPES_TABS_NEEDING_DATES: RecipesTab[] = ['consumption', 'variance', 'finished_goods'];
export const RECIPES_TABS_WITH_COMPARISON: RecipesTab[] = ['consumption', 'variance', 'finished_goods'];
