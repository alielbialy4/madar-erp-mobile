import type { Product } from '@/types/api';

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Matches backend `Product::isCurrentlyPromotional()`. */
export function isProductPromotional(product: Pick<Product, 'is_promotional' | 'promotional_price' | 'promotional_start_date' | 'promotional_end_date'>): boolean {
  if (!product.is_promotional || product.promotional_price == null) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const start = product.promotional_start_date ? new Date(product.promotional_start_date) : null;
  const end = product.promotional_end_date ? new Date(product.promotional_end_date) : null;

  if (start) {
    start.setHours(0, 0, 0, 0);
    if (now < start) return false;
  }
  if (end) {
    end.setHours(0, 0, 0, 0);
    if (now > end) return false;
  }

  return true;
}

/** Matches backend `Product::getEffectivePrice()` (base unit, before variant additional). */
export function effectiveCatalogUnitPrice(product: Product, variantId?: string | null): number {
  let base = num(product.selling_price);
  if (isProductPromotional(product)) {
    base = num(product.promotional_price);
  }
  if (variantId) {
    const variant = product.variants?.find((v) => String(v.id) === String(variantId));
    base += num(variant?.additional_price);
  }
  return base;
}
