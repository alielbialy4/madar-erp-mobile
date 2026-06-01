import type { WaiterOrderItem } from '@/api/waiter';
import { cartLineKey, type CartLine } from '@/store/posStore';
import type { Product } from '@/types/api';

function unitFactorForLine(line: CartLine, products: Product[]): number {
  const product = products.find((p) => Number(p.id) === Number(line.product_id));
  const units = product?.units ?? [];
  if (units.length === 0) return 1;
  const unit =
    line.unit_id != null
      ? units.find((u) => Number(u.id) === Number(line.unit_id))
      : units.find((u) => u.is_base) ?? units[0];
  const factor = Number(unit?.factor_to_base ?? 1);
  return Number.isFinite(factor) && factor > 0 ? factor : 1;
}

export function waiterLinesToApiItems(
  lines: CartLine[],
  products: Product[],
  notesByLineKey: Record<string, string> = {},
): WaiterOrderItem[] {
  return lines.map((line) => {
    const key = cartLineKey(line);
    const optionIds =
      line.selected_options?.flatMap((group) => group.options.map((option) => option.product_option_id)) ?? [];
    const selected_options =
      line.selected_options && line.selected_options.length > 0
        ? line.selected_options.map((group) => ({
            product_option_group_id: group.product_option_group_id,
            option_ids: group.options.map((option) => option.product_option_id),
          }))
        : undefined;

    return {
      product_id: line.product_id,
      quantity: line.quantity,
      unit_price: line.unit_price,
      notes: notesByLineKey[key]?.trim() || line.notes?.trim() || undefined,
      variant_id: line.variant_id ?? undefined,
      unit_id: line.unit_id ?? undefined,
      unit_factor: unitFactorForLine(line, products),
      selected_options,
      option_ids: optionIds.length > 0 ? optionIds : undefined,
    };
  });
}
