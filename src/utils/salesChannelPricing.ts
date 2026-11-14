import type { Product } from '@/types/api';

export type SalesChannelPriceQuote = {
  price?: number | null;
  contract?: string | null;
  exact_price?: number | null;
  markup_percent?: number | null;
  rounding_increment?: number | null;
  rounding_mode?: 'nearest' | 'up' | 'down' | string | null;
  pricing_version?: number | null;
  token?: string | null;
};

/** Runtime channel quotes may exist before Product typings catch up. */
type ProductWithChannelPricing = Product & {
  sales_channel_pricing?: Record<string, SalesChannelPriceQuote> | null;
};

/** Mirrors signed backend channel pricing for one product base price (V1). */
export function applySalesChannelBasePrice(
  amount: number,
  channel: SalesChannelPriceQuote,
  allowExactPrice: boolean,
): number {
  if (allowExactPrice && channel.exact_price != null) {
    return Math.round(Number(channel.exact_price) * 100) / 100;
  }
  const markedUp = Number(amount) * (1 + Math.max(0, Number(channel.markup_percent) || 0) / 100);
  const increment = Math.max(0, Number(channel.rounding_increment) || 0);
  if (increment <= 0) return Math.round(markedUp * 100) / 100;
  const ratio = markedUp / increment;
  const mode = channel.rounding_mode ?? 'nearest';
  const units =
    mode === 'up'
      ? Math.ceil(ratio - 0.00000001)
      : mode === 'down'
        ? Math.floor(ratio + 0.00000001)
        : Math.floor(ratio + 0.5);
  return Math.round(units * increment * 100) / 100;
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function variantAdditional(product: Product, variantId?: string | null): number {
  if (!variantId) return 0;
  const variant = product.variants?.find((entry) => String(entry.id) === String(variantId));
  if (!variant) throw new Error('Selected product variant is missing from the catalog.');
  return num(variant.additional_price);
}

function unitFactor(product: Product, unitId?: number | null): number {
  const units = product.units ?? [];
  if (units.length === 0) {
    if (unitId != null) throw new Error('Selected unit is missing from the catalog.');
    return 1;
  }
  const base = units.find((u) => u.is_base) ?? units[0];
  const unit = unitId == null ? base : units.find((u) => Number(u.id) === Number(unitId));
  const baseFactor = Number(base?.factor_to_base);
  const saleFactor = Number(unit?.factor_to_base);
  if (!unit || !Number.isFinite(baseFactor) || baseFactor <= 0 || !Number.isFinite(saleFactor) || saleFactor <= 0) {
    throw new Error('Selected unit has an invalid catalog conversion.');
  }
  return saleFactor / baseFactor;
}

/** Catalog unit selling price optionally rewritten by sales-channel quote. */
export function channelUnitPriceFromProduct(
  product: ProductWithChannelPricing,
  salesChannelId: string | null | undefined,
  variantId?: string | null,
  unitId?: number | null,
): number {
  const channel = salesChannelId ? product.sales_channel_pricing?.[salesChannelId] : undefined;
  // V1 server prices the attested channel product base first, then adds the variant.
  // Never re-markup the variant or infer a missing signed quote from catalog settings.
  if (salesChannelId && (!channel
    || channel.contract === 'sales_channel_price_v2'
    || !channel.token
    || typeof channel.price !== 'number'
    || !Number.isFinite(channel.price)
    || channel.price < 0)) {
    throw new Error('A valid V1 signed channel price quote is required.');
  }
  const base = channel ? channel.price! : num(product.selling_price);
  const unitPrice = (base + variantAdditional(product, variantId)) * unitFactor(product, unitId);
  return Math.round(unitPrice * 100) / 100;
}

export function channelPriceToken(
  product: ProductWithChannelPricing | undefined,
  salesChannelId: string | null | undefined,
): string | undefined {
  if (!product || !salesChannelId) return undefined;
  const token = product.sales_channel_pricing?.[salesChannelId]?.token;
  return token ? String(token) : undefined;
}
