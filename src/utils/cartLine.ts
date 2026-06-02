import type { CartLineSelectedOption } from '@/types/api';

export type CartLine = {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  unit_id?: number | null;
  variant_id?: string | null;
  variant_name?: string | null;
  notes?: string;
  selected_options?: CartLineSelectedOption[];
};

function selectedOptionsSignature(opts?: CartLineSelectedOption[]): string {
  if (!opts?.length) return '';
  return opts
    .map((group) => {
      const optionIds = group.options.map((option) => option.product_option_id).sort((a, b) => a - b).join(',');
      return `${group.product_option_group_id}:${optionIds}`;
    })
    .join('|');
}

export function cartLineKey(line: Pick<CartLine, 'product_id' | 'variant_id' | 'unit_id' | 'selected_options'>): string {
  return [
    line.product_id,
    line.variant_id ?? '',
    line.unit_id ?? '',
    selectedOptionsSignature(line.selected_options),
  ].join('__');
}
