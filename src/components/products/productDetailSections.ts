import type { Product } from '@/types/api';
import type { MetricKind } from './ProductInsightsMetric';
import { money, numberText, dateText, asText } from '@/utils/format';
import { parseApiMoneyFirst } from '@/utils/parseMoney';
import { getProductQuantity } from './productUtils';

export type DetailField = {
  label: string;
  value: string;
  kind: MetricKind;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
};

function moneyValue(v: unknown): string {
  return money(parseApiMoneyFirst(v) ?? 0).replace(' ج.م', '');
}

function baseUnitName(product: Product): string {
  const fromUnits = product.units?.find((u) => u.is_base)?.name;
  if (fromUnits) return fromUnits;
  const unit = product.unit;
  if (typeof unit === 'string') return unit;
  const u = product as Product & { base_unit?: { name?: string }; unit?: { name?: string } };
  return u.base_unit?.name ?? u.unit?.name ?? '—';
}

function inventoryModeLabel(product: Product): string {
  if (product.inventory_mode === 'recipe_product') return 'منتج بوصفة';
  if (product.inventory_mode === 'non_stock' || product.track_inventory === false) return 'غير مخزني';
  return 'منتج مخزني';
}

function roleLabel(role?: string | null): string {
  switch (role) {
    case 'raw_material':
      return 'خامة';
    case 'packaging_material':
      return 'مواد تغليف';
    case 'semi_finished':
      return 'نصف مصنع';
    case 'service':
      return 'خدمة';
    default:
      return 'منتج قابل للبيع';
  }
}

export function buildPricingFields(product: Product, isRawMaterial: boolean): DetailField[] {
  if (isRawMaterial) {
    return [
      { label: 'تكلفة الشراء', value: moneyValue(product.cost_price), kind: 'money' },
      { label: 'قابل للشراء', value: product.is_purchasable === false ? 'لا' : 'نعم', kind: 'text' },
      { label: 'مكون وصفة', value: product.is_recipe_ingredient === false ? 'لا' : 'نعم', kind: 'text' },
    ];
  }
  const selling = Number(parseApiMoneyFirst(product.selling_price) ?? 0);
  const cost = Number(parseApiMoneyFirst(product.cost_price) ?? 0);
  const margin = Math.max(0, selling - cost);
  const fields: DetailField[] = [
    { label: 'سعر البيع', value: moneyValue(product.selling_price), kind: 'money', tone: 'success' },
  ];
  fields.push(
    { label: 'التكلفة', value: moneyValue(product.cost_price), kind: 'money' },
    { label: 'هامش تقريبي', value: moneyValue(margin), kind: 'money', tone: margin > 0 ? 'info' : 'default' },
  );
  if (product.is_promotional) {
    if (product.promotional_price != null) {
      fields.push({
        label: 'سعر العرض',
        value: moneyValue(product.promotional_price),
        kind: 'money',
        tone: 'success',
      });
    }
    if (product.promotional_start_date) {
      fields.push({
        label: 'بداية العرض',
        value: dateText(product.promotional_start_date),
        kind: 'date',
      });
    }
    if (product.promotional_end_date) {
      fields.push({
        label: 'نهاية العرض',
        value: dateText(product.promotional_end_date),
        kind: 'date',
      });
    }
  }
  return fields;
}

export function buildIdentityFields(product: Product): DetailField[] {
  const sku =
    (product as Product & { sku?: string; code?: string }).sku ??
    (product as Product & { code?: string }).code ??
    '—';
  const barcodes = (product.barcodes ?? []).filter(Boolean);
  const barcodeDisplay =
    barcodes.length > 1 ? barcodes.join('، ') : barcodes[0] ?? product.barcode ?? '—';

  return [
    { label: 'SKU / الكود', value: String(sku), kind: 'text' },
    { label: barcodes.length > 1 ? 'الباركودات' : 'الباركود', value: barcodeDisplay, kind: 'text' },
    { label: 'الوحدة الأساسية', value: baseUnitName(product), kind: 'text' },
    { label: 'دور المنتج', value: roleLabel(product.product_role), kind: 'text' },
  ];
}

export function buildStockFields(product: Product): DetailField[] {
  const qty = getProductQuantity(product);
  return [
    { label: 'نوع المخزون', value: inventoryModeLabel(product), kind: 'text' },
    { label: 'المتاح حالياً', value: numberText(qty), kind: 'qty', tone: qty <= 0 ? 'danger' : 'success' },
    { label: 'حد التنبيه', value: numberText(product.min_stock_alert ?? 0), kind: 'qty' },
    { label: 'تتبع الصلاحية', value: product.track_expiry ? 'نعم' : 'لا', kind: 'text' },
    { label: 'تتبع الدفعات', value: product.track_batch ? 'نعم' : 'لا', kind: 'text' },
    {
      label: 'الحالة',
      value: product.active === false || product.is_active === false ? 'غير نشط' : 'نشط',
      kind: 'text',
      tone: product.active === false || product.is_active === false ? 'warning' : 'success',
    },
    { label: 'مميز', value: product.featured ? 'نعم' : 'لا', kind: 'text' },
  ];
}

export function buildRecipeCostingFields(product: Product): DetailField[] {
  const rc = product.recipe_costing;
  if (!rc) return [];
  const fields: DetailField[] = [];
  if (rc.recipe_cost != null) {
    fields.push({ label: 'تكلفة الوصفة', value: moneyValue(rc.recipe_cost), kind: 'money' });
  }
  if (rc.sale_price != null) {
    fields.push({ label: 'سعر البيع', value: moneyValue(rc.sale_price), kind: 'money', tone: 'success' });
  }
  if (rc.gross_margin != null) {
    fields.push({ label: 'هامش إجمالي', value: moneyValue(rc.gross_margin), kind: 'money', tone: 'info' });
  }
  if (rc.margin_percentage != null) {
    fields.push({
      label: 'نسبة الهامش',
      value: String(Number(rc.margin_percentage).toFixed(1)),
      kind: 'percent',
    });
  }
  return fields;
}

export function buildUnitsFields(product: Product): DetailField[] {
  return (product.units ?? []).map((u) => ({
    label: u.name,
    value: u.is_base ? `أساسية · معامل ${numberText(u.factor_to_base ?? 1)}` : `معامل ${numberText(u.factor_to_base ?? 1)}`,
    kind: 'text' as const,
  }));
}

export function buildDescriptionField(product: Product): DetailField | null {
  if (!product.description?.trim()) return null;
  return { label: 'نص الوصف', value: product.description.trim(), kind: 'text' };
}

export function buildSpecsFields(product: Product): DetailField[] {
  const fields: DetailField[] = [];
  if (product.storage_type) {
    fields.push({ label: 'نوع التخزين', value: asText(product.storage_type), kind: 'text' });
  }
  if (product.default_shelf_life_days != null) {
    fields.push({
      label: 'مدة الصلاحية الافتراضية',
      value: `${numberText(product.default_shelf_life_days)} يوم`,
      kind: 'text',
    });
  }
  const specs = product.specs;
  if (specs && typeof specs === 'object') {
    const labels: Record<string, string> = {
      brand: 'العلامة',
      grade: 'الدرجة',
      origin: 'المنشأ',
      production_date: 'تاريخ الإنتاج',
      expiry_date: 'تاريخ الانتهاء',
      shelf_life_months: 'مدة الصلاحية (شهر)',
    };
    for (const [key, label] of Object.entries(labels)) {
      const val = specs[key];
      if (val != null && val !== '') {
        fields.push({ label, value: String(val), kind: 'text' });
      }
    }
  }
  return fields;
}
