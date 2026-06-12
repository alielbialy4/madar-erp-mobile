import type { CartLineSelectedOption } from '@/types/api';
import type { CartLine } from '@/utils/cartLine';

export function computeOptionsPrice(opts?: CartLineSelectedOption[]): number {
  if (!opts || opts.length === 0) return 0;
  let total = 0;
  for (const g of opts) {
    if (g.pricing_type === 'group_price') {
      total += Number(g.group_price ?? 0) || 0;
    } else if (g.pricing_type === 'per_option') {
      for (const o of g.options) total += Number(o.option_price ?? 0) || 0;
    }
  }
  return Math.round(total * 100) / 100;
}

export function lineUnitPriceWithOptions(line: CartLine): number {
  return line.unit_price + computeOptionsPrice(line.selected_options);
}

export function cartLineGross(line: CartLine): number {
  return Math.max(0, lineUnitPriceWithOptions(line) * line.quantity - (line.discount || 0));
}
