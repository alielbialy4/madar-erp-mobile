import type { CartLine } from '@/utils/cartLine';
import type { Product } from '@/types/api';
import { channelUnitPriceFromProduct } from '@/utils/salesChannelPricing';

/**
 * Preserve sale-time channel cart identity and prices when restoring a draft.
 * Checkout still validates channel availability and signed prices before posting.
 */
export function restoreSalesChannelDraft(params: {
  requestedChannelId: string | null;
  externalOrderReference: string | null | undefined;
  lines: CartLine[];
  products: Product[];
}): {
  salesChannelId: string | null;
  externalOrderReference: string;
  lines: CartLine[];
} {
  if (params.requestedChannelId) {
    return {
      salesChannelId: params.requestedChannelId,
      externalOrderReference: String(params.externalOrderReference ?? ''),
      lines: params.lines,
    };
  }

  const lines = params.lines.map((line) => {
    const product = params.products.find((entry) => Number(entry.id) === Number(line.product_id));
    if (!product) return line;
    const unitPrice = channelUnitPriceFromProduct(product, null, line.variant_id ?? null, line.unit_id ?? null);
    return { ...line, unit_price: unitPrice };
  });

  return {
    salesChannelId: null,
    externalOrderReference: '',
    lines,
  };
}
