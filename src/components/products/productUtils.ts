import type { Product } from '@/types/api';
import { parseApiMoneyFirst } from '@/utils/parseMoney';

export type ProductBadgeTone = 'danger' | 'warning' | 'success' | 'info' | 'neutral';

export type ProductBadge = { label: string; tone: ProductBadgeTone };

export function getProductQuantity(item: Product): number {
  return Number(item.branch_available_quantity ?? item.available_quantity ?? item.stock_quantity ?? 0);
}

export function getProductBadge(item: Product): ProductBadge {
  const qty = getProductQuantity(item);
  const min = Number(item.min_stock_alert ?? 0);
  if (item.inventory_mode === 'recipe_product') return { label: 'وصفة', tone: 'warning' };
  if (item.inventory_mode === 'non_stock') return { label: 'غير مخزني', tone: 'info' };
  if (item.track_inventory === false) return { label: 'خدمة', tone: 'info' };
  if (qty <= 0) return { label: 'نفد', tone: 'danger' };
  if (min > 0 && qty <= min) return { label: 'منخفض', tone: 'warning' };
  if (item.is_promotional) return { label: 'عرض', tone: 'success' };
  if (item.featured) return { label: 'مميز', tone: 'info' };
  if (item.active === false || item.is_active === false) return { label: 'غير نشط', tone: 'neutral' };
  return { label: 'متوفر', tone: 'success' };
}

export function getProductPrices(item: Product): { display: number; compare?: number; isPromo: boolean } {
  const isPromo = Boolean(item.is_promotional && item.promotional_price != null);
  const selling = parseApiMoneyFirst(item.selling_price) ?? 0;
  const promo = parseApiMoneyFirst(item.promotional_price) ?? 0;
  if (isPromo) return { display: promo, compare: selling, isPromo: true };
  return { display: selling, isPromo: false };
}

export function productListStats(items: Product[]) {
  let low = 0;
  let out = 0;
  let promo = 0;
  for (const item of items) {
    const qty = getProductQuantity(item);
    const min = Number(item.min_stock_alert ?? 0);
    if ((item.inventory_mode ?? (item.track_inventory === false ? 'non_stock' : 'stock_product')) === 'stock_product') {
      if (qty <= 0) out += 1;
      else if (min > 0 && qty <= min) low += 1;
    }
    if (item.is_promotional) promo += 1;
  }
  return { total: items.length, low, out, promo };
}
