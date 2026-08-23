import type { BranchSettingsPatch } from '@/api/branchesManage';
import { DEFAULT_LOGO_SCALE } from '@/utils/printLogoSize';

export const PRINT_FONT_SIZE_MIN = 10;
export const PRINT_FONT_SIZE_MAX = 22;
export const DEFAULT_CUSTOMER_RECEIPT_FONT_SIZE = 12;
export const DEFAULT_KITCHEN_TICKET_FONT_SIZE = 14;
export const DEFAULT_SHIFT_CLOSE_FONT_SIZE = 12;
export const DEFAULT_CUSTOMER_RECEIPT_FOOTER_MESSAGE = 'شكراً لزيارتكم';
export const DEFAULT_CUSTOMER_RECEIPT_DEVELOPER_FOOTER = 'Powered by Madar';

export type ServiceChargeApplyTo = 'dine_in' | 'delivery' | 'takeaway' | 'all';

export type ReceiptPrintMode = 'quality_image' | 'fast_text';

export type BranchSettingsForm = {
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
  customer_printer_profile_id: string;
  print_sequence_max: string;
  print_sequence_mode: 'branch_continuous' | 'wrap_from_one' | 'manual_start';
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
  tax_enabled: boolean;
  tax_rate: string;
  tax_name: string;
  tax_inclusive: boolean;
  service_charge_enabled: boolean;
  service_charge_type: 'percentage' | 'fixed';
  service_charge_value: string;
  service_charge_apply_to: ServiceChargeApplyTo;
  service_charge_label: string;
  allow_pos_discount: boolean;
  allow_pos_coupon: boolean;
  customer_receipt_font_size: string;
  kitchen_ticket_font_size: string;
  shift_close_font_size: string;
  customer_receipt_logo_scale: string;
};

export function defaultBranchSettingsForm(): BranchSettingsForm {
  return {
    receipt_print_mode: 'quality_image',
    auto_print_receipt: false,
    enable_kitchen_print: false,
    use_server_kitchen_print_queue: false,
    receipt_show_invoice_number: true,
    receipt_show_invoice_barcode: false,
    receipt_show_product_category: false,
    receipt_show_print_sequence: false,
    receipt_show_branch_name: true,
    customer_printer_name: '',
    customer_printer_profile_id: '',
    print_sequence_max: '',
    print_sequence_mode: 'branch_continuous',
    receipt_footer: '',
    customer_receipt_footer_message: DEFAULT_CUSTOMER_RECEIPT_FOOTER_MESSAGE,
    customer_receipt_developer_footer: DEFAULT_CUSTOMER_RECEIPT_DEVELOPER_FOOTER,
    receipt_logo_url: '',
    receipt_header: '',
    receipt_address: '',
    receipt_phone: '',
    receipt_email: '',
    receipt_return_policy: '',
    print_shift_close_report: false,
    tax_enabled: false,
    tax_rate: '0',
    tax_name: 'ضريبة القيمة المضافة',
    tax_inclusive: false,
    service_charge_enabled: false,
    service_charge_type: 'percentage',
    service_charge_value: '0',
    service_charge_apply_to: 'dine_in',
    service_charge_label: 'رسوم الخدمة',
    allow_pos_discount: true,
    allow_pos_coupon: true,
    customer_receipt_font_size: String(DEFAULT_CUSTOMER_RECEIPT_FONT_SIZE),
    kitchen_ticket_font_size: String(DEFAULT_KITCHEN_TICKET_FONT_SIZE),
    shift_close_font_size: String(DEFAULT_SHIFT_CLOSE_FONT_SIZE),
    customer_receipt_logo_scale: String(DEFAULT_LOGO_SCALE),
  };
}

function truthy(v: unknown): boolean {
  return v === true || v === '1' || v === 1;
}

function falsyFlag(v: unknown): boolean {
  return v === false || v === '0' || v === 0 || v === 'false';
}

export function parseBranchSettingsObject(obj?: Record<string, unknown>): BranchSettingsForm {
  const base = defaultBranchSettingsForm();
  if (!obj) return base;
  const legacyFooter = obj.receipt_footer != null ? String(obj.receipt_footer) : '';
  const customerFooter =
    obj.customer_receipt_footer_message != null
      ? String(obj.customer_receipt_footer_message)
      : legacyFooter || DEFAULT_CUSTOMER_RECEIPT_FOOTER_MESSAGE;

  const applyTo = obj.service_charge_apply_to;
  const serviceApply: ServiceChargeApplyTo =
    applyTo === 'delivery' || applyTo === 'takeaway' || applyTo === 'all' ? applyTo : 'dine_in';

  const rawMode = obj.receipt_print_mode;
  const receiptPrintMode: ReceiptPrintMode =
    rawMode === 'fast_text' ? 'fast_text' : 'quality_image';

  return {
    ...base,
    receipt_print_mode: receiptPrintMode,
    auto_print_receipt: truthy(obj.auto_print_receipt),
    enable_kitchen_print: truthy(obj.enable_kitchen_print),
    use_server_kitchen_print_queue: truthy(obj.use_server_kitchen_print_queue),
    receipt_show_invoice_number: obj.receipt_show_invoice_number === undefined ? true : truthy(obj.receipt_show_invoice_number),
    receipt_show_invoice_barcode: truthy(obj.receipt_show_invoice_barcode),
    receipt_show_product_category: truthy(obj.receipt_show_product_category),
    receipt_show_print_sequence: truthy(obj.receipt_show_print_sequence),
    receipt_show_branch_name: obj.receipt_show_branch_name === undefined ? true : truthy(obj.receipt_show_branch_name),
    customer_printer_name: String(obj.customer_printer_name ?? ''),
    customer_printer_profile_id: String(obj.customer_printer_profile_id ?? ''),
    print_sequence_max: obj.print_sequence_max != null ? String(obj.print_sequence_max) : '',
    print_sequence_mode:
      obj.print_sequence_mode === 'wrap_from_one' || obj.print_sequence_mode === 'manual_start'
        ? obj.print_sequence_mode
        : 'branch_continuous',
    receipt_footer: legacyFooter,
    customer_receipt_footer_message: customerFooter,
    customer_receipt_developer_footer: String(
      obj.customer_receipt_developer_footer ?? DEFAULT_CUSTOMER_RECEIPT_DEVELOPER_FOOTER,
    ),
    receipt_logo_url: String(obj.receipt_logo_url ?? ''),
    receipt_header: String(obj.receipt_header ?? ''),
    receipt_address: String(obj.receipt_address ?? ''),
    receipt_phone: String(obj.receipt_phone ?? ''),
    receipt_email: String(obj.receipt_email ?? ''),
    receipt_return_policy: String(obj.receipt_return_policy ?? ''),
    print_shift_close_report: truthy(obj.print_shift_close_report),
    tax_enabled: truthy(obj.tax_enabled),
    tax_rate: String(obj.tax_rate ?? '0'),
    tax_name: String(obj.tax_name ?? 'ضريبة القيمة المضافة'),
    tax_inclusive: truthy(obj.tax_inclusive),
    service_charge_enabled: truthy(obj.service_charge_enabled),
    service_charge_type: obj.service_charge_type === 'fixed' ? 'fixed' : 'percentage',
    service_charge_value: String(obj.service_charge_value ?? '0'),
    service_charge_apply_to: serviceApply,
    service_charge_label: String(obj.service_charge_label ?? 'رسوم الخدمة'),
    allow_pos_discount: !falsyFlag(obj.allow_pos_discount),
    allow_pos_coupon: !falsyFlag(obj.allow_pos_coupon),
    customer_receipt_font_size: String(obj.customer_receipt_font_size ?? DEFAULT_CUSTOMER_RECEIPT_FONT_SIZE),
    kitchen_ticket_font_size: String(obj.kitchen_ticket_font_size ?? DEFAULT_KITCHEN_TICKET_FONT_SIZE),
    shift_close_font_size: String(obj.shift_close_font_size ?? DEFAULT_SHIFT_CLOSE_FONT_SIZE),
    customer_receipt_logo_scale: String(obj.customer_receipt_logo_scale ?? DEFAULT_LOGO_SCALE),
  };
}

export function isPrintFontSizeInRange(size: number): boolean {
  return Number.isFinite(size) && size >= PRINT_FONT_SIZE_MIN && size <= PRINT_FONT_SIZE_MAX;
}

export function buildBranchSettingsPayload(form: BranchSettingsForm, keys?: (keyof BranchSettingsPatch)[]): BranchSettingsPatch {
  const raw = form.print_sequence_max.trim();
  let printSequenceMax: number | null = null;
  if (raw !== '') {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 1) printSequenceMax = Math.min(999999, n);
  }

  const full: BranchSettingsPatch = {
    receipt_print_mode: form.receipt_print_mode,
    auto_print_receipt: form.auto_print_receipt,
    enable_kitchen_print: form.enable_kitchen_print,
    use_server_kitchen_print_queue: form.use_server_kitchen_print_queue,
    receipt_show_invoice_number: form.receipt_show_invoice_number,
    receipt_show_invoice_barcode: form.receipt_show_invoice_barcode,
    receipt_show_product_category: form.receipt_show_product_category,
    receipt_show_print_sequence: form.receipt_show_print_sequence,
    receipt_show_branch_name: form.receipt_show_branch_name,
    customer_printer_name: form.customer_printer_name.trim() || null,
    customer_printer_profile_id: form.customer_printer_profile_id.trim() || null,
    receipt_footer: form.receipt_footer.trim() || null,
    customer_receipt_footer_message: form.customer_receipt_footer_message.trim() || null,
    customer_receipt_developer_footer: form.customer_receipt_developer_footer.trim() || null,
    receipt_header: form.receipt_header.trim() || null,
    receipt_address: form.receipt_address.trim() || null,
    receipt_phone: form.receipt_phone.trim() || null,
    receipt_email: form.receipt_email.trim() || null,
    receipt_return_policy: form.receipt_return_policy.trim() || null,
    print_shift_close_report: form.print_shift_close_report,
    tax_enabled: form.tax_enabled,
    tax_rate: Math.max(0, Math.min(100, Number(form.tax_rate || 0))),
    tax_name: form.tax_name.trim() || 'ضريبة القيمة المضافة',
    tax_inclusive: form.tax_inclusive,
    service_charge_enabled: form.service_charge_enabled,
    service_charge_type: form.service_charge_type,
    service_charge_value: Math.max(0, Number(form.service_charge_value || 0)),
    service_charge_apply_to: form.service_charge_apply_to,
    service_charge_label: form.service_charge_label.trim() || 'رسوم الخدمة',
    allow_pos_discount: form.allow_pos_discount,
    allow_pos_coupon: form.allow_pos_coupon,
    customer_receipt_font_size: parseInt(form.customer_receipt_font_size, 10),
    kitchen_ticket_font_size: parseInt(form.kitchen_ticket_font_size, 10),
    shift_close_font_size: parseInt(form.shift_close_font_size, 10),
    customer_receipt_logo_scale: parseInt(form.customer_receipt_logo_scale, 10),
    print_sequence_max: printSequenceMax,
    print_sequence_mode: form.print_sequence_mode || 'branch_continuous',
  };

  if (!keys) return full;
  const partial: BranchSettingsPatch = {};
  for (const key of keys) {
    (partial as Record<string, unknown>)[key] = full[key];
  }
  return partial;
}
