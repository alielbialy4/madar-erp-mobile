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

/** Convert a selected price-defining choice to the current sale unit. */
export function priceDefiningOptionUnitPrice(product: Product, choicePrice: number, unitId?: number | null): number {
  return unitSellingPrice(
    { ...product, selling_price: choicePrice, is_promotional: false },
    null,
    unitId,
  );
}

export function priceDefiningRange(product: Product): { min: number; max: number } | null {
  const group = product.option_groups?.find(
    (candidate) => candidate.price_behavior === 'defines_base_price' && candidate.is_active !== false,
  );
  if (!group) return null;
  const prices = (group.options ?? [])
    .filter((option) => option.is_active !== false)
    .map((option) => Number(option.price))
    .filter((price) => Number.isFinite(price) && price >= 0);
  if (prices.length === 0) return null;
  const asUnitPrice = (price: number) => priceDefiningOptionUnitPrice(product, price);
  return { min: asUnitPrice(Math.min(...prices)), max: asUnitPrice(Math.max(...prices)) };
}

export function unitMeta(product: Product, unitId?: number | null) {
  const units = product.units ?? [];
  const baseUnit = units.find((u) => u.is_base) ?? units[0];
  const saleUnit =
    unitId != null ? units.find((u) => Number(u.id) === Number(unitId)) ?? baseUnit : baseUnit;
  return saleUnit ?? null;
}
