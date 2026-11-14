/** Web HoldCartModal / POS: channel carts cannot use hold carts or dine-in tables. */

export const HOLD_CART_REQUIRES_DIRECT_MESSAGE_AR =
  'حوّل قناة البيع إلى مباشر قبل حفظ أو استعادة سلة معلّقة.';

export const HOLD_CART_REQUIRES_DIRECT_MESSAGE_EN =
  'Switch the sales channel to Direct before saving or restoring a held cart.';

export const DINE_IN_REQUIRES_DIRECT_MESSAGE_AR =
  'حوّل قناة البيع إلى مباشر قبل فتح طاولة داخلية.';

export function holdCartBlockedBySalesChannel(salesChannelId: string | null | undefined): boolean {
  return Boolean(salesChannelId && String(salesChannelId).trim());
}

/** Same channel gate used for hold carts and dine-in table selection. */
export const salesChannelBlocksDirectOps = holdCartBlockedBySalesChannel;
