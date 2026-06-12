import { normalizeReceiptPrintMode } from '@/services/printing/resolvePrintPath';
import {
  DEFAULT_CUSTOMER_RECEIPT_FONT_SIZE,
  DEFAULT_CUSTOMER_RECEIPT_FOOTER_MESSAGE,
  DEFAULT_KITCHEN_TICKET_FONT_SIZE,
  isPrintFontSizeInRange,
} from '@/utils/branchSettings';
import { clampLogoScale } from '@/utils/printLogoSize';

export type ReceiptPrintMode = 'quality_image' | 'fast_text';

export const DEFAULT_RECEIPT_PRINT_MODE: ReceiptPrintMode = 'quality_image';

export type BranchPrintSettingsNormalized = {
  receipt_print_mode: ReceiptPrintMode;
  auto_print_receipt: boolean;
  enable_kitchen_print: boolean;
  use_server_kitchen_print_queue: boolean;
  receipt_show_invoice_number: boolean;
  receipt_show_invoice_barcode: boolean;
  receipt_show_product_category: boolean;
  receipt_show_print_sequence: boolean;
  receipt_show_branch_name: boolean;
  customer_printer_name: string;
  print_sequence_max: string;
  receipt_footer: string;
  customer_receipt_footer_message: string;
  customer_receipt_developer_footer: string;
  receipt_logo_url: string;
  receipt_header: string;
  receipt_address: string;
  receipt_phone: string;
  receipt_email: string;
  receipt_return_policy: string;
  print_shift_close_report: boolean;
  customer_receipt_font_size: number;
  kitchen_ticket_font_size: number;
  shift_close_font_size: number;
  customer_receipt_logo_scale: number;
};

export const DEFAULT_CUSTOMER_RECEIPT_DEVELOPER_FOOTER = 'Powered by Madar';

function clampPrintFontSize(value: unknown, kind: 'customer' | 'kitchen'): number {
  const fallback =
    kind === 'kitchen' ? DEFAULT_KITCHEN_TICKET_FONT_SIZE : DEFAULT_CUSTOMER_RECEIPT_FONT_SIZE;
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!isPrintFontSizeInRange(n)) return fallback;
  return n;
}

/** Normalizes `branches.settings` / `catalog.branch.settings` for POS printing. */
export function normalizeBranchPrintSettings(
  raw: Record<string, unknown> | null | undefined,
): BranchPrintSettingsNormalized {
  const r = raw ?? {};
  const hasSetting = (key: string): boolean => Object.prototype.hasOwnProperty.call(r, key);
  const stringSetting = (key: string, fallback = ''): string => {
    if (!hasSetting(key)) return fallback;
    const value = r[key];
    if (value == null) return '';
    return typeof value === 'string' ? value : String(value);
  };
  const boolSetting = (key: string, defaultValue: boolean): boolean => {
    const value = r[key];
    if (value === undefined || value === null || value === '') return defaultValue;
    return value === true || value === 1 || value === '1';
  };
  const legacyReceiptFooter = stringSetting('receipt_footer');
  const customerFooterFallback = hasSetting('receipt_footer')
    ? legacyReceiptFooter
    : DEFAULT_CUSTOMER_RECEIPT_FOOTER_MESSAGE;

  const receiptPrintMode = normalizeReceiptPrintMode(r.receipt_print_mode);

  return {
    receipt_print_mode: receiptPrintMode,
    auto_print_receipt: boolSetting('auto_print_receipt', false),
    enable_kitchen_print: boolSetting('enable_kitchen_print', false),
    use_server_kitchen_print_queue: boolSetting('use_server_kitchen_print_queue', false),
    receipt_show_invoice_number: boolSetting('receipt_show_invoice_number', true),
    receipt_show_invoice_barcode: boolSetting('receipt_show_invoice_barcode', true),
    receipt_show_product_category: boolSetting('receipt_show_product_category', false),
    receipt_show_print_sequence: boolSetting('receipt_show_print_sequence', true),
    receipt_show_branch_name: boolSetting('receipt_show_branch_name', true),
    customer_printer_name: typeof r.customer_printer_name === 'string' ? r.customer_printer_name : '',
    print_sequence_max:
      r.print_sequence_max != null && r.print_sequence_max !== '' ? String(r.print_sequence_max) : '',
    receipt_footer: legacyReceiptFooter,
    customer_receipt_footer_message: stringSetting(
      'customer_receipt_footer_message',
      customerFooterFallback,
    ),
    customer_receipt_developer_footer: stringSetting(
      'customer_receipt_developer_footer',
      DEFAULT_CUSTOMER_RECEIPT_DEVELOPER_FOOTER,
    ),
    receipt_logo_url: typeof r.receipt_logo_url === 'string' ? r.receipt_logo_url : '',
    receipt_header: typeof r.receipt_header === 'string' ? r.receipt_header : '',
    receipt_address: typeof r.receipt_address === 'string' ? r.receipt_address : '',
    receipt_phone: typeof r.receipt_phone === 'string' ? r.receipt_phone : '',
    receipt_email: typeof r.receipt_email === 'string' ? r.receipt_email : '',
    receipt_return_policy: typeof r.receipt_return_policy === 'string' ? r.receipt_return_policy : '',
    print_shift_close_report: boolSetting('print_shift_close_report', false),
    customer_receipt_font_size: clampPrintFontSize(r.customer_receipt_font_size, 'customer'),
    kitchen_ticket_font_size: clampPrintFontSize(r.kitchen_ticket_font_size, 'kitchen'),
    shift_close_font_size: clampPrintFontSize(r.shift_close_font_size, 'customer'),
    customer_receipt_logo_scale: clampLogoScale(r.customer_receipt_logo_scale),
  };
}
