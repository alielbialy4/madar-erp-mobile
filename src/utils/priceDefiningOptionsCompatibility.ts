import type { CartLine } from '@/utils/cartLine';

export function priceDefiningOptionsCapabilityError(
  lines: CartLine[],
  capabilityVersion?: number | null,
): string | null {
  const hasPriceDefiningSelection = lines.some((line) =>
    line.selected_options?.some((group) => group.price_behavior === 'defines_base_price'),
  );

  return hasPriceDefiningSelection && Number(capabilityVersion ?? 0) < 1
    ? 'كتالوج نقطة البيع قديم أو غير متوافق مع خيارات تحديد السعر. حدّث الكتالوج قبل إتمام البيع.'
    : null;
}
