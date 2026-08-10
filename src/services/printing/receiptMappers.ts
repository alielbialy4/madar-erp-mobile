import type { CartLine } from '@/utils/cartLine';
import type { ReceiptPrintPayload } from '@/types/printing';
import { mapCartOptionsToReceipt } from '@/services/printing/buildReceiptViewModel';
import { getPaymentPrintLabel } from '@/constants/printLabels';
import { normalizeBranchPrintSettings } from '@/utils/branchPrintSettings';
import { posAllowsCoupon, posAllowsDiscount } from '@/utils/posTotals';

type CategoryRef = { id: number; name: string };
type ProductRef = { id: number; name: string; category_id?: number | null };

export type CheckoutReceiptInput = {
  branchName?: string;
  cashierName?: string;
  customerName?: string | null;
  saleId?: number;
  invoiceNumber?: string | null;
  printSequence?: number | string | null;
  cartLines: CartLine[];
  products: ProductRef[];
  categories?: CategoryRef[];
  catalogSettings: Record<string, unknown>;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee?: number;
  total: number;
  paid: number;
  change?: number;
  balance?: number;
  paymentType: string;
  paymentBreakdown?: { label: string; amount: number }[];
  couponCode?: string | null;
  couponDiscount?: number;
  notes?: string | null;
  orderType?: string | null;
  tableName?: string | null;
  documentTitle?: string | null;
  isReprint?: boolean;
  isOffline?: boolean;
  localOrderId?: string | null;
};

function categoryNameFor(productId: number, products: ProductRef[], categories?: CategoryRef[]): string | null {
  const product = products.find((p) => p.id === productId);
  if (!product?.category_id || !categories?.length) return null;
  return categories.find((c) => c.id === product.category_id)?.name ?? null;
}

export function mapCheckoutToReceiptPayload(input: CheckoutReceiptInput): ReceiptPrintPayload {
  const printSettings = normalizeBranchPrintSettings(input.catalogSettings);
  const showSubtotal = posAllowsDiscount(input.catalogSettings) || posAllowsCoupon(input.catalogSettings);

  return {
    branch_name: printSettings.receipt_show_branch_name ? input.branchName : undefined,
    cashier_name: input.cashierName,
    customer_name: input.customerName,
    date: new Date().toLocaleString('ar-EG-u-nu-latn'),
    local_order_id: input.localOrderId,
    server_invoice_number:
      printSettings.receipt_show_invoice_number && input.invoiceNumber
        ? input.invoiceNumber
        : input.saleId
          ? String(input.saleId)
          : null,
    print_sequence: input.printSequence,
    order_type: input.orderType,
    table_name: input.tableName,
    document_title: input.documentTitle,
    is_offline_unsynced: input.isOffline,
    is_reprint: input.isReprint,
    show_subtotal: showSubtotal,
    items: input.cartLines.map((line) => ({
      name: line.variant_name ? `${line.product_name} - ${line.variant_name}` : line.product_name,
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount: line.discount ?? 0,
      line_total: Math.max(0, line.quantity * line.unit_price - (line.discount ?? 0)),
      notes: line.notes,
      category_name: categoryNameFor(line.product_id, input.products, input.categories),
      options: mapCartOptionsToReceipt(line.selected_options),
    })),
    subtotal: input.subtotal,
    discount: input.discount,
    tax: input.tax,
    delivery_fee: input.deliveryFee ?? 0,
    total: input.total,
    paid: input.paid,
    change: input.change ?? 0,
    balance: input.balance ?? 0,
    payment_type: getPaymentPrintLabel(input.paymentType),
    payment_breakdown: input.paymentBreakdown,
    coupon_code: input.couponCode,
    coupon_discount: input.couponDiscount ?? 0,
    coupon_label: input.couponCode,
    notes: input.notes,
    _printSettings: printSettings,
  };
}

export function mapSalePrintResponseToPayload(
  sale: Record<string, unknown>,
  store: Record<string, unknown>,
  options?: {
    isReprint?: boolean;
    documentTitle?: string;
    showBarcode?: boolean;
    receipt?: {
      mode?: string;
      document_number?: string | null;
      reference_invoice_number?: string | null;
      lines?: Record<string, unknown>[];
      totals?: Record<string, unknown>;
    } | null;
  },
): ReceiptPrintPayload {
  const printSettings = normalizeBranchPrintSettings(store as Record<string, unknown>);
  if (options?.showBarcode === false) {
    printSettings.receipt_show_invoice_barcode = false;
  }

  const receipt = options?.receipt ?? null;
  const mode = receipt?.mode ?? 'original';
  const items = Array.isArray(receipt?.lines) && receipt!.lines!.length > 0
    ? receipt!.lines!
    : Array.isArray(sale.items)
      ? sale.items
      : [];
  const showSubtotal = store.allow_pos_discount !== false || store.allow_pos_coupon !== false;

  const paymentBreakdown = Array.isArray(sale.payment_breakdown)
    ? (sale.payment_breakdown as { payment_method?: string; amount?: number | string; label?: string }[]).map(
        (line) => ({
          label: line.label ?? getPaymentPrintLabel(String(line.payment_method ?? '')),
          amount: Number(line.amount ?? 0),
        }),
      )
    : undefined;

  const customer = sale.customer as { name?: string } | undefined;
  const user = sale.user as { name?: string } | undefined;
  const diningTable = sale.dining_table as { name?: string } | undefined;
  const totals = receipt?.totals;

  const documentTitle =
    options?.documentTitle
    ?? (mode === 'return' ? 'مستند مرتجع' : mode === 'current' ? 'إيصال المتبقي' : undefined);

  return {
    branch_name: printSettings.receipt_show_branch_name ? String(store.name ?? '') : undefined,
    cashier_name: user?.name,
    customer_name: customer?.name ?? null,
    date: sale.sale_date
      ? new Date(String(sale.sale_date)).toLocaleString('ar-EG-u-nu-latn')
      : new Date().toLocaleString('ar-EG-u-nu-latn'),
    server_invoice_number: receipt?.document_number != null
      ? String(receipt.document_number)
      : sale.invoice_number != null
        ? String(sale.invoice_number)
        : String(sale.id ?? ''),
    print_sequence: mode === 'return' ? null : (sale.print_sequence as number | string | null),
    order_type: sale.order_type ? String(sale.order_type) : null,
    table_name: diningTable?.name ?? null,
    document_title: documentTitle,
    is_reprint: options?.isReprint,
    show_subtotal: showSubtotal,
    items: items.map((raw) => {
      const item = raw as Record<string, unknown>;
      const product = item.product as Record<string, unknown> | undefined;
      const category = product?.category as { name?: string } | undefined;
      return {
        name: String(product?.name ?? item.product_name ?? 'صنف'),
        quantity: Number(item.quantity ?? 1),
        unit_price: Number(item.unit_price ?? 0),
        discount: Number(item.discount ?? 0),
        line_total: Number(item.subtotal ?? 0),
        category_name: category?.name ?? null,
        options: Array.isArray(item.options)
          ? (item.options as { group_title?: string; options?: { name?: string; applied_price?: number }[] }[]).map(
              (g) => ({
                group_title: String(g.group_title ?? ''),
                options: (g.options ?? []).map((o) => ({
                  name: String(o.name ?? ''),
                  applied_price: o.applied_price,
                })),
              }),
            )
          : undefined,
      };
    }),
    subtotal: Number(totals?.subtotal ?? sale.subtotal ?? 0),
    discount: Number(totals?.discount ?? sale.discount ?? 0),
    tax: Number(totals?.tax ?? sale.tax ?? 0),
    delivery_fee: mode === 'return' || mode === 'current' ? 0 : Number(sale.delivery_fee ?? 0),
    total: Number(totals?.total ?? sale.total ?? 0),
    paid: Number(totals?.paid ?? sale.paid ?? 0),
    change: Number(sale.change ?? 0),
    balance: Number(sale.balance ?? 0),
    payment_type: getPaymentPrintLabel(String(sale.payment_type ?? '')),
    payment_breakdown: mode === 'original' ? paymentBreakdown : undefined,
    coupon_code: mode === 'original' && sale.coupon_code ? String(sale.coupon_code) : null,
    coupon_discount: mode === 'original' ? Number(sale.coupon_discount ?? 0) : 0,
    notes: [
      sale.notes ? String(sale.notes) : null,
      receipt?.reference_invoice_number ? `مرجع الفاتورة: ${receipt.reference_invoice_number}` : null,
    ].filter(Boolean).join('\n') || null,
    _printSettings: printSettings,
  };
}

export function mapCartToTablePreInvoicePayload(input: {
  branchName?: string;
  cashierName?: string;
  cartLines: CartLine[];
  products: ProductRef[];
  categories?: CategoryRef[];
  catalogSettings: Record<string, unknown>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  tableName?: string | null;
  printSequence?: number | string | null;
  invoiceNumber?: string | null;
  documentTitle: string;
}): ReceiptPrintPayload {
  const payload = mapCheckoutToReceiptPayload({
    branchName: input.branchName,
    cashierName: input.cashierName,
    cartLines: input.cartLines,
    products: input.products,
    categories: input.categories,
    catalogSettings: input.catalogSettings,
    subtotal: input.subtotal,
    discount: input.discount,
    tax: input.tax,
    total: input.total,
    paid: input.total,
    paymentType: 'credit',
    printSequence: input.printSequence,
    invoiceNumber: input.invoiceNumber,
    tableName: input.tableName,
    orderType: input.tableName ? 'dine_in' : undefined,
    documentTitle: input.documentTitle,
  });
  if (payload._printSettings) {
    payload._printSettings = { ...payload._printSettings, receipt_show_invoice_barcode: false };
  }
  return payload;
}
