import type { TableOrderDraftPayload } from '@/api/dining';
import type { CartLineSelectedOption, SalePayload } from '@/types/api';
import { cartLineKey, type CartLine } from '@/utils/cartLine';

export type PosDiningTableSelection = {
  id: string;
  name?: string | null;
  number?: string | null;
  hallName?: string | null;
  activeOrderId?: number | string | null;
  printSequence?: number | string | null;
  invoiceNumber?: string | null;
  /** ISO timestamp from last successful server sync (optimistic locking). */
  saleUpdatedAt?: string | null;
};

export type BuildTableDraftInput = {
  cart: CartLine[];
  table: PosDiningTableSelection;
  subtotal: number;
  tax: number;
  invoiceDiscount: number;
  promotionDiscount: number;
  couponId?: string | null;
  couponDiscount: number;
  serviceCharge: number;
  total: number;
  customerId?: number | null;
  notes?: string | null;
  allowDiscount?: boolean;
};

function cartLineUid(line: Pick<CartLine, 'product_id' | 'variant_id' | 'unit_id' | 'selected_options'>): string {
  return cartLineKey(line);
}

export function saleToCartLines(sale: Record<string, unknown> | null | undefined): CartLine[] {
  const items = Array.isArray(sale?.items) ? sale.items : [];
  return items.map((rawItem) => {
    const item = rawItem as Record<string, unknown>;
    const product = item.product as Record<string, unknown> | undefined;
    const variant = item.variant as Record<string, unknown> | undefined;

    const line: CartLine = {
      product_id: Number(item.product_id),
      product_name: String(product?.name ?? ''),
      quantity: Number(item.quantity ?? 0),
      unit_price: Number(item.unit_price ?? 0),
      discount: Number(item.discount ?? 0),
      unit_id: item.unit_id != null ? Number(item.unit_id) : null,
      variant_id: item.variant_id != null ? String(item.variant_id) : null,
      variant_name: variant?.name != null ? String(variant.name) : null,
      selected_options: mapSaleOptions(item.options),
    };

    return line;
  });
}

function mapSaleOptions(raw: unknown): CartLineSelectedOption[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((groupRaw) => {
    const group = groupRaw as Record<string, unknown>;
    if (Array.isArray(group.options)) {
      return group as unknown as CartLineSelectedOption;
    }
    return {
      product_option_group_id: Number(group.product_option_group_id),
      group_title: String(group.product_option_group_title ?? ''),
      pricing_type: (group.pricing_type as CartLineSelectedOption['pricing_type']) ?? 'per_option',
      options: [
        {
          product_option_id: Number(group.product_option_id),
          name: String(group.product_option_name ?? ''),
          option_price: Number(group.option_price ?? group.applied_price ?? 0),
          applied_price: Number(group.applied_price ?? 0),
        },
      ],
    };
  });
}

export function diningTableDisplayName(table: Pick<PosDiningTableSelection, 'id' | 'name' | 'number'>): string {
  if (table.name?.trim()) return table.name.trim();
  if (table.number != null && String(table.number).trim()) return `طاولة ${table.number}`;
  return `طاولة ${table.id}`;
}

export { cartLineUid };

export function saleItemsFromCart(cart: CartLine[]): SalePayload['items'] {
  return cart.map((line) => ({
    product_id: line.product_id,
    quantity: line.quantity,
    unit_price: line.unit_price,
    discount: line.discount,
    unit_id: line.unit_id ?? null,
    variant_id: line.variant_id ?? null,
    selected_options: line.selected_options?.map((group) => ({
      product_option_group_id: group.product_option_group_id,
      option_ids: group.options.map((option) => option.product_option_id),
    })),
  }));
}

export function buildTableOrderDraftPayload(input: BuildTableDraftInput): TableOrderDraftPayload {
  const allowDiscount = input.allowDiscount !== false;
  return {
    expected_sale_updated_at: input.table.activeOrderId ? input.table.saleUpdatedAt ?? null : null,
    items: input.cart.map((line) => ({
      product_id: line.product_id,
      quantity: line.quantity,
      unit_id: line.unit_id ?? null,
      unit_price: line.unit_price,
      discount: allowDiscount ? line.discount || 0 : 0,
      variant_id: line.variant_id ?? null,
      selected_options: line.selected_options?.map((group) => ({
        product_option_group_id: group.product_option_group_id,
        option_ids: group.options.map((option) => option.product_option_id),
      })),
      client_cart_line_id: cartLineUid(line),
    })),
    subtotal: input.subtotal,
    tax: input.tax,
    discount: input.invoiceDiscount,
    promotion_discount: input.promotionDiscount,
    coupon_id: input.couponId ?? null,
    coupon_discount: input.couponDiscount,
    service_charge: input.serviceCharge,
    total: input.total,
    customer_id: input.customerId ?? null,
    notes: input.notes ?? null,
  };
}

export function cartContextFromSale(sale: Record<string, unknown>): {
  lines: CartLine[];
  cartDiscount: number;
  customer: import('@/types/api').Customer | null;
  appliedCoupon: { coupon: import('@/types/api').Coupon; discount: number } | null;
} {
  const items = Array.isArray(sale.items) ? sale.items : [];
  const manualDiscount = Number(sale.discount ?? 0);
  const promotionDiscount = Number(sale.promotion_discount ?? 0);
  const couponDiscount = Number(sale.coupon_discount ?? 0);
  const cartDiscount = Math.max(0, manualDiscount - promotionDiscount - couponDiscount);

  let appliedCoupon: { coupon: import('@/types/api').Coupon; discount: number } | null = null;
  if (sale.coupon_id) {
    appliedCoupon = {
      coupon: {
        id: String(sale.coupon_id),
        code: typeof sale.coupon_code === 'string' ? sale.coupon_code : '',
      } as import('@/types/api').Coupon,
      discount: couponDiscount,
    };
  }

  return {
    lines: items.length > 0 ? saleToCartLines(sale) : [],
    cartDiscount,
    customer: (sale.customer as import('@/types/api').Customer | null) ?? null,
    appliedCoupon,
  };
}

export function saleMetaFromServer(sale: Record<string, unknown> | null | undefined): Partial<PosDiningTableSelection> {
  if (!sale) return {};
  return {
    activeOrderId: sale.id as number | string | null,
    printSequence: (sale.print_sequence as number | string | null) ?? null,
    invoiceNumber: sale.invoice_number != null ? String(sale.invoice_number) : null,
    saleUpdatedAt: typeof sale.updated_at === 'string' ? sale.updated_at : null,
  };
}
