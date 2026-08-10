import type { CartLine } from '@/store/posStore';
import type { Product } from '@/types/api';
import { cartLineGross } from '@/utils/cartPricing';

export type CatalogPromotion = {
  id: string;
  name: string;
  type: string;
  reward_value: string | number;
  config?: Record<string, unknown> | null;
  priority: number;
  branch_id?: string | null;
  conditions?: {
    id?: string;
    condition_type: string;
    condition_value?: Record<string, unknown> | null;
  }[];
};

export type EnrichedLine = {
  _idx: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  category_id: number | null;
  brand: string | null;
};

function lineSubtotal(l: CartLine): number {
  return cartLineGross(l);
}

export function enrichCartLines(lines: CartLine[], products: Product[]): EnrichedLine[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return lines.map((l, idx) => {
    const p = byId.get(l.product_id);
    const brand = (p as Product & { brand?: string | null })?.brand;
    return {
      _idx: idx,
      product_id: l.product_id,
      quantity: l.quantity,
      unit_price: l.unit_price,
      line_total: lineSubtotal(l),
      category_id: p?.category_id ?? p?.category?.id ?? null,
      brand: brand ? String(brand).trim() : null,
    };
  });
}

function sumLines(items: EnrichedLine[]): number {
  return items.reduce((s, r) => s + r.line_total, 0);
}

function conditionPasses(
  type: string,
  value: Record<string, unknown>,
  items: EnrichedLine[],
  originalTotal: number,
): boolean {
  switch (type) {
    case 'min_cart_total':
      return originalTotal >= Number(value.min ?? 0);
    case 'specific_product': {
      const ids = (value.product_ids as (number | string)[] | undefined)?.map((x) => parseInt(String(x), 10)) ?? [];
      return items.some((row) => row.product_id && ids.includes(row.product_id));
    }
    case 'specific_category': {
      const ids = (value.category_ids as (number | string)[] | undefined)?.map((x) => parseInt(String(x), 10)) ?? [];
      return items.some((row) => row.category_id != null && ids.includes(row.category_id));
    }
    case 'specific_brand': {
      const needle = String(value.brand ?? '')
        .trim()
        .toLowerCase();
      if (!needle) return false;
      return items.some((row) => row.brand && row.brand.toLowerCase() === needle);
    }
    default:
      return false;
  }
}

function promotionMatches(p: CatalogPromotion, items: EnrichedLine[], originalTotal: number, branchId: string | null): boolean {
  if (p.branch_id && branchId && p.branch_id !== branchId) return false;
  const conds = p.conditions ?? [];
  for (const c of conds) {
    const val = (c.condition_value ?? {}) as Record<string, unknown>;
    if (!conditionPasses(c.condition_type, val, items, originalTotal)) return false;
  }
  return true;
}

function lineMatchesBogoFilters(p: CatalogPromotion, row: EnrichedLine): boolean {
  const conds = p.conditions ?? [];
  const hasScoped = conds.some((c) =>
    ['specific_product', 'specific_category', 'specific_brand'].includes(c.condition_type),
  );
  if (!hasScoped) return true;

  for (const cond of conds) {
    const val = (cond.condition_value ?? {}) as Record<string, unknown>;
    switch (cond.condition_type) {
      case 'min_cart_total':
        break;
      case 'specific_product': {
        const ids = (val.product_ids as (number | string)[] | undefined)?.map((x) => parseInt(String(x), 10)) ?? [];
        if (ids.length === 0 || !row.product_id || !ids.includes(row.product_id)) return false;
        break;
      }
      case 'specific_category': {
        const ids = (val.category_ids as (number | string)[] | undefined)?.map((x) => parseInt(String(x), 10)) ?? [];
        if (ids.length === 0 || row.category_id == null || !ids.includes(row.category_id)) return false;
        break;
      }
      case 'specific_brand': {
        const needle = String(val.brand ?? '')
          .trim()
          .toLowerCase();
        if (!needle || !row.brand || row.brand.toLowerCase() !== needle) return false;
        break;
      }
      default:
        break;
    }
  }
  return true;
}

function filterQualifyingLines(p: CatalogPromotion, items: EnrichedLine[]): EnrichedLine[] {
  const hasScoped = (p.conditions ?? []).some((c) =>
    ['specific_product', 'specific_category', 'specific_brand'].includes(c.condition_type),
  );
  if (!hasScoped) return items;
  return items.filter((row) => lineMatchesBogoFilters(p, row));
}

function computeBogoDiscount(p: CatalogPromotion, items: EnrichedLine[]): number {
  const cfg = (p.config ?? {}) as Record<string, unknown>;
  const buyQty = Math.max(1, parseInt(String(cfg.buy_qty ?? 2), 10) || 2);
  const getQty = Math.max(1, parseInt(String(cfg.get_qty ?? 1), 10) || 1);
  const pct = Math.min(
    100,
    Math.max(0, parseFloat(String(cfg.discount_percent_on_get ?? p.reward_value ?? 100))),
  );

  const qualifying = filterQualifyingLines(p, items);
  const units: { price: number }[] = [];
  for (const row of qualifying) {
    for (let i = 0; i < row.quantity; i++) {
      units.push({ price: row.unit_price });
    }
  }
  if (units.length === 0) return 0;

  units.sort((a, b) => a.price - b.price);
  const groupSize = buyQty + getQty;
  let discount = 0;
  for (let i = 0; i + groupSize <= units.length; i += groupSize) {
    const chunk = units.slice(i, i + groupSize);
    for (let j = 0; j < getQty; j++) {
      const u = chunk[buyQty + j];
      if (u) discount += (u.price * pct) / 100;
    }
  }
  return Math.round(discount * 10000) / 10000;
}

function computeDiscount(p: CatalogPromotion, items: EnrichedLine[], runningTotal: number): number {
  const rv = parseFloat(String(p.reward_value ?? 0)) || 0;
  switch (p.type) {
    case 'percentage_discount':
      return Math.round(runningTotal * (rv / 100) * 10000) / 10000;
    case 'fixed_discount':
      return Math.min(rv, runningTotal);
    case 'bogo':
      return computeBogoDiscount(p, items);
    default:
      return 0;
  }
}

export type LocalPromotionResult = {
  originalTotal: number;
  promotionDiscountTotal: number;
  applied: { promotion_id: string; name: string; type: string; amount: number }[];
};

export function evaluateLocalCartPromotions(
  promotions: CatalogPromotion[] | undefined,
  lines: CartLine[],
  products: Product[],
  branchId: string | null,
): LocalPromotionResult {
  const items = enrichCartLines(lines, products);
  const originalTotal = sumLines(items);
  if (!promotions?.length || items.length === 0) {
    return { originalTotal, promotionDiscountTotal: 0, applied: [] };
  }

  const sorted = [...promotions].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  let running = originalTotal;
  const applied: LocalPromotionResult['applied'] = [];

  for (const promo of sorted) {
    if (!promotionMatches(promo, items, originalTotal, branchId)) continue;
    const d = computeDiscount(promo, items, running);
    if (d <= 0) continue;
    const take = Math.min(d, running);
    running -= take;
    applied.push({
      promotion_id: promo.id,
      name: promo.name,
      type: promo.type,
      amount: Math.round(take * 10000) / 10000,
    });
    if (running <= 0) break;
  }

  const promotionDiscountTotal = Math.round((originalTotal - running) * 100) / 100;
  return { originalTotal, promotionDiscountTotal, applied };
}
