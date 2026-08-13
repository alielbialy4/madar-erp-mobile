import type { CartLine } from '@/store/posStore';
import type { PosCatalog, Product } from '@/types/api';
import type { ServiceChargeApplyTo } from '@/utils/branchSettings';
import { cartLineGross } from '@/utils/cartPricing';
import { evaluateLocalCartPromotions, type CatalogPromotion } from '@/services/pos/localPromotionEngine';

export type PosOrderType = 'dine_in' | 'takeaway' | 'delivery';

function shouldMergeBranchSetting(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}

function asSettingsRecord(value: unknown): Record<string, unknown> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

/** Merges catalog + branch settings for POS (tax, charges, printing, receipts). */
export function resolvePosCatalogSettings(catalog: PosCatalog | null | undefined): Record<string, unknown> {
  const base = { ...asSettingsRecord(catalog?.settings) };
  const branch = asSettingsRecord(catalog?.branch?.settings);
  const taxKeys = ['tax_enabled', 'tax_rate', 'tax_name', 'tax_inclusive'] as const;
  const hasBranchTax = taxKeys.some((key) => shouldMergeBranchSetting(branch[key]));
  if (hasBranchTax) {
    for (const key of taxKeys) {
      if (shouldMergeBranchSetting(branch[key])) {
        base[key] = branch[key];
      }
    }
  }
  for (const [key, value] of Object.entries(branch)) {
    if (shouldMergeBranchSetting(value)) {
      base[key] = value;
    }
  }
  return base;
}

function truthySetting(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

/** Mirrors backend `branchTaxEnabled`: unset → per-product fallback tax. */
export function branchTaxMode(settings: Record<string, unknown>): 'enabled' | 'disabled' | 'fallback' {
  const value = settings.tax_enabled;
  if (value === undefined || value === null || value === '') return 'fallback';
  if (truthySetting(value)) return 'enabled';
  return 'disabled';
}

function computeCheckoutTax(params: {
  lines: CartLine[];
  products: Product[];
  settings: Record<string, unknown>;
  afterDiscount: number;
}): number {
  const mode = branchTaxMode(params.settings);
  if (mode === 'disabled') return 0;

  if (mode === 'enabled') {
    const taxRate = Math.max(0, Number(params.settings.tax_rate ?? 0) || 0);
    if (taxRate <= 0) return 0;
    return Math.round(params.afterDiscount * taxRate) / 100;
  }

  const byId = new Map(params.products.map((p) => [p.id, p]));
  const tax = params.lines.reduce((sum, line) => {
    const lineSub = cartLineGross(line);
    const product = byId.get(line.product_id);
    const lineRate = Math.max(
      0,
      Number((product as Product & { tax_rate?: number | string | null })?.tax_rate ?? 0) || 0,
    );
    return sum + (lineSub * lineRate) / 100;
  }, 0);
  return Math.round(tax * 100) / 100;
}

export function posAllowsDiscount(settings: Record<string, unknown>): boolean {
  const value = settings.allow_pos_discount;
  if (value === undefined || value === null || value === '') return true;
  return truthySetting(value);
}

export function posAllowsCoupon(settings: Record<string, unknown>): boolean {
  const value = settings.allow_pos_coupon;
  if (value === undefined || value === null || value === '') return true;
  return truthySetting(value);
}

export function computeServiceCharge(
  settings: Record<string, unknown>,
  orderType: PosOrderType,
  baseAfterDiscount: number,
): number {
  if (!truthySetting(settings.service_charge_enabled)) return 0;
  const applyTo = (settings.service_charge_apply_to as ServiceChargeApplyTo | undefined) ?? 'dine_in';
  if (applyTo !== 'all' && applyTo !== orderType) return 0;
  const value = Math.max(0, Number(settings.service_charge_value ?? 0) || 0);
  const base = Math.max(0, baseAfterDiscount);
  if (settings.service_charge_type === 'fixed') {
    return Math.round(Math.min(value, base) * 100) / 100;
  }
  return Math.round((base * value) / 100 * 100) / 100;
}

function lineGross(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + cartLineGross(line), 0);
}

export type PosCheckoutTotals = {
  gross: number;
  lineDiscount: number;
  promotionDiscount: number;
  appliedPromotions: { name: string; amount: number }[];
  manualDiscount: number;
  couponDiscount: number;
  afterDiscount: number;
  tax: number;
  serviceCharge: number;
  deliveryFee: number;
  loyaltyDiscount: number;
  totalBeforeLoyalty: number;
  total: number;
  invoiceDiscount: number;
  serviceChargeLabel: string;
};

export function computePosCheckoutTotals(params: {
  lines: CartLine[];
  products: Product[];
  promotions?: CatalogPromotion[];
  settings: Record<string, unknown>;
  branchId: string | null;
  manualDiscount?: number;
  couponDiscount?: number;
  loyaltyDiscount?: number;
  orderType: PosOrderType;
  deliveryFee?: number;
}): PosCheckoutTotals {
  const gross = lineGross(params.lines);
  const lineDiscount = params.lines.reduce((s, l) => s + (l.discount || 0), 0);
  const promoEval = evaluateLocalCartPromotions(
    params.promotions,
    params.lines,
    params.products,
    params.branchId,
    { orderType: params.orderType },
  );
  const promotionDiscount = promoEval.promotionDiscountTotal;
  const manualDiscount = Math.min(
    Math.max(0, params.manualDiscount ?? 0),
    Math.max(0, gross - promotionDiscount),
  );
  const couponDiscount = Math.min(
    Math.max(0, params.couponDiscount ?? 0),
    Math.max(0, gross - promotionDiscount - manualDiscount),
  );
  const afterDiscount = Math.max(0, gross - promotionDiscount - manualDiscount - couponDiscount);

  const tax = computeCheckoutTax({
    lines: params.lines,
    products: params.products,
    settings: params.settings,
    afterDiscount,
  });

  const serviceCharge = computeServiceCharge(params.settings, params.orderType, afterDiscount);
  const deliveryFee = Math.max(0, params.deliveryFee ?? 0);
  const loyaltyDiscount = Math.min(Math.max(0, params.loyaltyDiscount ?? 0), afterDiscount + tax + serviceCharge + deliveryFee);

  const totalBeforeLoyalty = Math.round((afterDiscount + tax + serviceCharge + deliveryFee) * 100) / 100;
  const total = Math.max(0, Math.round((totalBeforeLoyalty - loyaltyDiscount) * 100) / 100);
  const invoiceDiscount = Math.round((lineDiscount + manualDiscount + promotionDiscount + couponDiscount) * 100) / 100;

  return {
    gross,
    lineDiscount,
    promotionDiscount,
    appliedPromotions: promoEval.applied.map((p) => ({ name: p.name, amount: p.amount })),
    manualDiscount,
    couponDiscount,
    afterDiscount,
    tax,
    serviceCharge,
    deliveryFee,
    loyaltyDiscount,
    totalBeforeLoyalty,
    total,
    invoiceDiscount,
    serviceChargeLabel: String(params.settings.service_charge_label ?? 'رسوم الخدمة'),
  };
}
