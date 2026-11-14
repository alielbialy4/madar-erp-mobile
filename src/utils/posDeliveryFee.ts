/**
 * Resolve POS delivery fee with web cashier manual-fee parity.
 * When `manualFee` is set (including 0), it wins over the zone catalog fee.
 */
export function resolvePosDeliveryFee(params: {
  orderTypeIsDelivery: boolean;
  zoneFee: number;
  manualFee: number | null | undefined;
}): number {
  if (!params.orderTypeIsDelivery) return 0;
  if (params.manualFee != null && Number.isFinite(params.manualFee)) {
    return Math.max(0, Number(params.manualFee));
  }
  return Math.max(0, Number(params.zoneFee) || 0);
}

/** True when cashier fee differs from the selected zone fee (backend stamps override actor). */
export function isDeliveryFeeOverridden(zoneFee: number, chargedFee: number): boolean {
  return Math.round((Number(zoneFee) || 0) * 100) !== Math.round((Number(chargedFee) || 0) * 100);
}

export type DeliveryCollectionMethod = 'cashier' | 'driver';

/** Web EMPTY_DELIVERY_DRAFT.collectionMethod default. */
export const DEFAULT_DELIVERY_COLLECTION_METHOD: DeliveryCollectionMethod = 'driver';

/**
 * Web `platformManagedDelivery`: sales-channel delivery when responsibility is not restaurant.
 * Restaurant-owned channel delivery still uses the cashier delivery draft/fee/COD flow.
 */
export function isPlatformManagedDelivery(params: {
  orderTypeIsDelivery: boolean;
  salesChannel: { delivery_responsibility?: string | null } | null | undefined;
}): boolean {
  if (!params.orderTypeIsDelivery || !params.salesChannel) return false;
  return params.salesChannel.delivery_responsibility !== 'restaurant';
}

/**
 * Web `isDeliveryZoneRequirementMet`: when zones are configured (or unknown), zoneId required.
 * `zonesConfigured === false` means confirmed zero zones → zone not required.
 */
export function isDeliveryZoneRequirementMet(params: {
  zoneId: string | null | undefined;
  zonesConfigured: boolean | null;
}): boolean {
  if (params.zonesConfigured === false) return true;
  return Boolean(params.zoneId && String(params.zoneId).trim());
}

/**
 * Web `resolveDeliveryCollectionPayment` — driver COD forces credit/paid=0.
 */
export function resolveDeliveryCollectionPayment<T extends string>(
  paymentType: T,
  paid: number,
  collectedByDriver: boolean,
): { paymentType: T | 'credit'; paid: number } {
  if (!collectedByDriver) return { paymentType, paid };
  return { paymentType: 'credit', paid: 0 };
}
