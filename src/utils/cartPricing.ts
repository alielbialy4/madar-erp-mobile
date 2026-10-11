import type { CartLineSelectedOption } from '@/types/api';
import type { CartLine } from '@/utils/cartLine';

export function computeOptionsPrice(opts?: CartLineSelectedOption[]): number {
  if (!opts || opts.length === 0) return 0;
  let total = 0;
  for (const g of opts) {
    if (g.price_behavior === 'defines_base_price') continue;
    if (g.pricing_type === 'group_price') {
      total += Number(g.group_price ?? 0) || 0;
    } else if (g.pricing_type === 'per_option') {
      for (const o of g.options) total += Number(o.option_price ?? 0) || 0;
    }
  }
  return Math.round(total * 100) / 100;
}

export function lineUnitPriceWithOptions(line: CartLine): number {
  return unitPriceWithOptions(line.unit_price, line.selected_options);
}

/** Same unit-price composition used by cart lines and the modifier preview. */
export function unitPriceWithOptions(baseUnitPrice: number, opts?: CartLineSelectedOption[]): number {
  const definedBasePrice = opts
    ?.find((group) => group.price_behavior === 'defines_base_price')
    ?.options[0]?.option_price ?? 0;
  return Math.round((Number(baseUnitPrice || 0) + Number(definedBasePrice || 0) + computeOptionsPrice(opts)) * 100) / 100;
}

export function cartLineGross(line: CartLine): number {
  return Math.max(0, lineUnitPriceWithOptions(line) * line.quantity - (line.discount || 0));
}
