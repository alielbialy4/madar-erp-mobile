import type { InsightsProduct, MovementType, StockStatus } from '@/types/productInsights';

export function stockStatusLabel(status: StockStatus): string {
  switch (status) {
    case 'low_stock':
      return 'منخفض';
    case 'out_of_stock':
      return 'نفد';
    default:
      return 'متوفر';
  }
}

export function stockStatusTone(status: StockStatus): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'low_stock':
      return 'warning';
    case 'out_of_stock':
      return 'danger';
    default:
      return 'success';
  }
}

export function movementTypeLabel(type: MovementType): string {
  switch (type) {
    case 'sale':
      return 'بيع';
    case 'refund':
      return 'مرتجع';
    case 'purchase':
      return 'شراء';
    case 'purchase_return':
      return 'مرتجع مورد';
    case 'transfer':
      return 'تحويل';
    case 'adjustment':
      return 'تعديل';
    case 'stock_count':
      return 'جرد';
    case 'damage':
      return 'تالف';
    case 'manual_in':
      return 'إدخال يدوي';
    case 'manual_out':
      return 'إخراج يدوي';
    default:
      return type;
  }
}

export function formatReturnRate(rate: number | null): string {
  if (rate == null || !Number.isFinite(rate)) return '—';
  return `${(rate * 100).toFixed(1)}%`;
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date();
}

export function formatShortDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = parseIsoDate(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function countRangeDays(from: string, to: string): number {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diff / 86_400_000) + 1);
}

export function rangeDaysBadge(from: string, to: string): string {
  const days = countRangeDays(from, to);
  return days === 1 ? 'يوم واحد' : `${days} يوم`;
}

export const RANGE_PRESETS = [
  { days: 7, label: '7 أيام' },
  { days: 30, label: '30 يوم' },
  { days: 90, label: '90 يوم' },
] as const;

export function buildRangePreset(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

export function detectActivePreset(from: string, to: string): number | null {
  for (const preset of RANGE_PRESETS) {
    const built = buildRangePreset(preset.days);
    if (built.from === from && built.to === to) return preset.days;
  }
  return null;
}

export function deriveStockHeroTone(
  trackInventory: boolean,
  totalQuantity: number,
  minStockAlert: number,
): 'default' | 'success' | 'warning' | 'danger' {
  if (!trackInventory) return 'default';
  if (totalQuantity <= 0) return 'danger';
  if (minStockAlert > 0 && totalQuantity <= minStockAlert) return 'warning';
  return 'success';
}

export function deriveStockHeroLabel(
  trackInventory: boolean,
  totalQuantity: number,
  minStockAlert: number,
): string | null {
  if (!trackInventory) return null;
  if (totalQuantity <= 0) return 'نفد';
  if (minStockAlert > 0 && totalQuantity <= minStockAlert) return 'منخفض';
  return 'متوفر';
}

export function createPlaceholderProduct(name: string, id = 0): InsightsProduct {
  return {
    id,
    name,
    barcode: null,
    barcodes: [],
    description: null,
    category: null,
    image: null,
    cost_price: 0,
    selling_price: 0,
    effective_price: 0,
    tax_rate: 0,
    is_active: true,
    featured: false,
    track_inventory: true,
    min_stock_alert: 0,
    is_promotional: false,
    promotional_price: null,
    created_at: null,
    updated_at: null,
  };
}
