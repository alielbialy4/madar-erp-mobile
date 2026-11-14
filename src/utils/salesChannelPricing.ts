import type { Product } from '@/types/api';

export type SalesChannelPriceQuote = {
  price?: number | null;
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
  return num(variant?.additional_price);
}

function unitFactor(product: Product, unitId?: number | null): number {
  if (!unitId || !product.units?.length) return 1;
  const unit = product.units.find((entry) => Number(entry.id) === Number(unitId));
  const factor = Number(unit?.factor_to_base);
  return Number.isFinite(factor) && factor > 0 ? factor : 1;
}

/** Catalog unit selling price optionally rewritten by sales-channel quote. */
export function channelUnitPriceFromProduct(
  product: ProductWithChannelPricing,
  salesChannelId: string | null | undefined,
  variantId?: string | null,
  unitId?: number | null,
): number {
  const base = Math.round((num(product.selling_price) + variantAdditional(product, variantId)) * 100) / 100;
  const channel = salesChannelId ? product.sales_channel_pricing?.[salesChannelId] : undefined;
  const priced = channel ? applySalesChannelBasePrice(base, channel, true) : base;
  return Math.round(priced * unitFactor(product, unitId) * 100) / 100;
}

export function channelPriceToken(
  product: ProductWithChannelPricing | undefined,
  salesChannelId: string | null | undefined,
): string | undefined {
  if (!product || !salesChannelId) return undefined;
  const token = product.sales_channel_pricing?.[salesChannelId]?.token;
  return token ? String(token) : undefined;
}
