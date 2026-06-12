import type { ReceiptPrintLabels } from '@/constants/printLabels';
import { receiptPrintLabels } from '@/constants/printLabels';
import { clampPrintFontSize, scaleReceiptCssPx } from '@/services/printing/printTypography';
import type { BranchPrintSettingsNormalized } from '@/utils/branchPrintSettings';
import { clampLogoScale } from '@/utils/printLogoSize';
import { money } from '@/utils/format';
import type {
  ReceiptLineOptionGroup,
  ReceiptPaymentBreakdownLine,
  ReceiptPrintItem,
  ReceiptPrintPayload,
} from '@/types/printing';

export type ReceiptViewModel = {
  fontSizePx: number;
  scaled: (base: number) => number;
  formatCurrency: (amount: number) => string;
  labels: ReceiptPrintLabels;
  showInvoiceNumber: boolean;
  showInvoiceBarcode: boolean;
  showProductCategory: boolean;
  showOrderNumber: boolean;
  showBranchName: boolean;
  logoUri: string | null;
  logoScalePercent: number;
  storeName: string;
  headerNote: string;
  address: string;
  phone: string;
  email: string;
  returnPolicy: string;
  footerMessage: string;
  developerFooter: string;
  documentTitle: string;
  printSequence: string;
  invoiceNumber: string;
  showInvoiceInMeta: boolean;
  showBarcode: boolean;
  date: string;
  customerName: string;
  cashierName: string;
  paymentSummary: string;
  orderContext: string;
  showOrderHero: boolean;
  items: ReceiptPrintItem[];
  showSubtotal: boolean;
  subtotal: number;
  discount: number;
  couponCode: string;
  couponDiscount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentBreakdown: ReceiptPaymentBreakdownLine[];
  showPaid: boolean;
  paid: number;
  change: number;
  balance: number;
  notes: string;
  isOffline: boolean;
  isReprint: boolean;
};

function asNumber(value: number | string | undefined | null): number {
  if (value == null || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function activePaymentBreakdown(breakdown?: ReceiptPaymentBreakdownLine[]): ReceiptPaymentBreakdownLine[] {
  return (breakdown ?? []).filter((line) => asNumber(line.amount) > 0);
}

function buildPaymentSummary(
  payload: ReceiptPrintPayload,
  breakdown: ReceiptPaymentBreakdownLine[],
): string {
  if (breakdown.length > 1) {
    return breakdown
      .map((line) => line.label.trim())
      .filter(Boolean)
      .join(' · ');
  }
  if (payload.payment_type?.trim() && payload.payment_type !== 'split') {
    return payload.payment_type.trim();
  }
  if (breakdown.length === 1 && breakdown[0].label.trim()) {
    return breakdown[0].label.trim();
  }
  return '';
}

function shouldShowPaidRow(payload: ReceiptPrintPayload): boolean {
  const paid = asNumber(payload.paid);
  const total = asNumber(payload.total);
  const change = asNumber(payload.change);
  const balance = asNumber(payload.balance);
  if (paid <= 0) return false;
  if (change > 0 || balance > 0) return true;
  return Math.abs(paid - total) > 0.009;
}

export function receiptCouponFromPayload(payload: ReceiptPrintPayload): {
  couponCode: string;
  couponDiscount: number;
} {
  const couponDiscount = asNumber(payload.coupon_discount);
  if (couponDiscount <= 0) return { couponCode: '', couponDiscount: 0 };
  const code = payload.coupon_code?.trim() || payload.coupon_label?.trim() || '';
  return { couponCode: code, couponDiscount };
}

export function buildReceiptViewModel(payload: ReceiptPrintPayload): ReceiptViewModel {
  const brand: BranchPrintSettingsNormalized | undefined = payload._printSettings;
  const fontSizePx = clampPrintFontSize(brand?.customer_receipt_font_size, 'customer');
  const scaled = (base: number) => scaleReceiptCssPx(base, fontSizePx);
  const formatCurrency = (amount: number) => money(amount);

  const showInvoiceNumber = brand?.receipt_show_invoice_number !== false;
  const showInvoiceBarcode = brand?.receipt_show_invoice_barcode !== false;
  const showProductCategory = brand?.receipt_show_product_category === true;
  const showOrderNumber = brand?.receipt_show_print_sequence !== false;
  const showBranchName = brand?.receipt_show_branch_name !== false;

  const invStr =
    payload.server_invoice_number != null ? String(payload.server_invoice_number).trim() : '';
  const printSeq =
    payload.print_sequence != null && String(payload.print_sequence).trim() !== ''
      ? String(payload.print_sequence).trim()
      : '';

  const showBarcode = Boolean(invStr && showInvoiceBarcode);
  const showInvoiceInMeta = Boolean(invStr && showInvoiceNumber && !showBarcode);

  const breakdown = activePaymentBreakdown(payload.payment_breakdown);
  const { couponCode, couponDiscount } = receiptCouponFromPayload(payload);

  const orderParts = [payload.order_type, payload.table_name].filter(Boolean);
  const orderContext = orderParts.join(' — ');

  const branchDisplayName = payload.branch_name?.trim() || 'Madar ERP';

  return {
    fontSizePx,
    scaled,
    formatCurrency,
    labels: receiptPrintLabels,
    showInvoiceNumber,
    showInvoiceBarcode,
    showProductCategory,
    showOrderNumber,
    showBranchName,
    logoUri: payload.logo_uri ?? brand?.receipt_logo_url ?? null,
    logoScalePercent: clampLogoScale(brand?.customer_receipt_logo_scale),
    storeName: showBranchName ? branchDisplayName : '',
    headerNote: brand?.receipt_header?.trim() ?? '',
    address: brand?.receipt_address?.trim() ?? '',
    phone: brand?.receipt_phone?.trim() ?? '',
    email: brand?.receipt_email?.trim() ?? '',
    returnPolicy: brand?.receipt_return_policy?.trim() ?? '',
    footerMessage: brand?.customer_receipt_footer_message?.trim() ?? '',
    developerFooter: brand?.customer_receipt_developer_footer?.trim() ?? '',
    documentTitle: payload.document_title?.trim() ?? '',
    printSequence: printSeq,
    invoiceNumber: invStr,
    showInvoiceInMeta,
    showBarcode,
    date: payload.date,
    customerName: payload.customer_name?.trim() ?? '',
    cashierName: payload.cashier_name?.trim() ?? '',
    paymentSummary: buildPaymentSummary(payload, breakdown),
    orderContext,
    showOrderHero: showOrderNumber && Boolean(printSeq),
    items: payload.items.map((item) => ({
      ...item,
      line_total:
        item.line_total ??
        Math.max(0, item.quantity * item.unit_price - (item.discount ?? 0)),
    })),
    showSubtotal: payload.show_subtotal !== false,
    subtotal: payload.subtotal,
    discount: payload.discount,
    couponCode,
    couponDiscount,
    tax: payload.tax,
    deliveryFee: asNumber(payload.delivery_fee),
    total: payload.total,
    paymentBreakdown: breakdown,
    showPaid: shouldShowPaidRow(payload),
    paid: payload.paid,
    change: asNumber(payload.change),
    balance: asNumber(payload.balance),
    notes: payload.notes?.trim() ?? '',
    isOffline: Boolean(payload.is_offline_unsynced),
    isReprint: Boolean(payload.is_reprint),
  };
}

export function mapCartOptionsToReceipt(
  selected?: Array<{
    group_title?: string;
    options: Array<{ name?: string; applied_price?: number }>;
  }>,
): ReceiptLineOptionGroup[] {
  if (!selected?.length) return [];
  return selected
    .map((group) => ({
      group_title: String(group.group_title ?? ''),
      options: group.options
        .map((opt) => ({
          name: String(opt.name ?? ''),
          applied_price: opt.applied_price,
        }))
        .filter((opt) => opt.name.trim()),
    }))
    .filter((g) => g.group_title.trim() || g.options.length > 0);
}
