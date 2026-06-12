import type { Product } from '@/types/api';
import { effectiveCatalogUnitPrice } from '@/utils/productPromotions';

/** Base catalog unit price (per `is_base` unit, before unit conversion). */
export function baseCatalogUnitPrice(product: Product, variantId?: string | null): number {
  return effectiveCatalogUnitPrice(product, variantId);
}

/** Selling price for the selected sale unit (base price × factor ratio). */
export function unitSellingPrice(
  product: Product,
  variantId?: string | null,
  unitId?: number | null,
): number {
  const baseUnitPrice = baseCatalogUnitPrice(product, variantId);
  const units = product.units ?? [];
  if (units.length === 0) return baseUnitPrice;

  const baseUnit = units.find((u) => u.is_base) ?? units[0];
  const saleUnit =
    unitId != null ? units.find((u) => Number(u.id) === Number(unitId)) ?? baseUnit : baseUnit;
  if (!baseUnit || !saleUnit) return baseUnitPrice;

  const baseFactor = Number(baseUnit.factor_to_base);
  const saleFactor = Number(saleUnit.factor_to_base);
  const safeBase = Number.isFinite(baseFactor) && baseFactor > 0 ? baseFactor : 1;
  const safeSale = Number.isFinite(saleFactor) && saleFactor > 0 ? saleFactor : 1;

  return Math.round(baseUnitPrice * (safeSale / safeBase) * 100) / 100;
}

export function unitMeta(product: Product, unitId?: number | null) {
  const units = product.units ?? [];
  const baseUnit = units.find((u) => u.is_base) ?? units[0];
  const saleUnit =
    unitId != null ? units.find((u) => Number(u.id) === Number(unitId)) ?? baseUnit : baseUnit;
  return saleUnit ?? null;
}
