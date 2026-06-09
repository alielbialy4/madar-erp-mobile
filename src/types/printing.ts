export type PrinterConnectionType =
  | 'network_tcp'
  | 'bluetooth_android'
  | 'airprint_ios'
  | 'vendor_sdk'
  | 'disabled';

export type PrinterRole = 'cashier' | 'kitchen' | 'bar' | 'shift' | 'report';
export type PaperWidth = '58mm' | '80mm';
export type PrinterMode = 'escpos_text' | 'escpos_image' | 'airprint';
export type EscPosEncoding = 'utf8' | 'cp864' | 'cp720' | 'windows1256' | 'utf8_image';

export type CodePagePreset = 'epson' | 'generic_clone';

export type CodePageTable = {
  cp864: number;
  cp720: number;
  windows1256: number;
};

export type PrinterProfile = {
  id: string;
  name: string;
  role: PrinterRole;
  connection_type: PrinterConnectionType;
  paper_width: PaperWidth;
  branch_id?: string | null;
  ip?: string;
  port: number;
  bluetoothAddress?: string;
  airprintName?: string;
  mode: PrinterMode;
  encoding: EscPosEncoding;
  code_page_preset?: CodePagePreset;
  code_page_table?: Partial<CodePageTable>;
  characters_per_line: number;
  cut_paper: boolean;
  enabled: boolean;
};

export type PrintJobType = 'receipt' | 'kitchen' | 'refund' | 'shift_summary';

export type PrintJobStatus = 'pending' | 'printing' | 'printed' | 'failed' | 'cancelled';

export type PrintJobRecord = {
  id: string;
  local_order_id?: string | null;
  server_sale_id?: number | null;
  type: PrintJobType;
  printer_profile_id: string;
  payload_snapshot: Record<string, unknown>;
  status: PrintJobStatus;
  attempts: number;
  error_message?: string | null;
  created_at: string;
  printing_at?: string | null;
  printed_at?: string | null;
};

export type ReceiptLineOptionGroup = {
  group_title: string;
  options: Array<{ name: string; applied_price?: number }>;
};

export type ReceiptPrintItem = {
  name: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  line_total?: number;
  notes?: string;
  description?: string;
  category_name?: string | null;
  options?: ReceiptLineOptionGroup[];
};

export type ReceiptPaymentBreakdownLine = {
  label: string;
  amount: number;
};

export type ReceiptPrintPayload = {
  branch_name?: string;
  cashier_name?: string;
  customer_name?: string | null;
  date: string;
  local_order_id?: string | null;
  server_invoice_number?: string | null;
  print_sequence?: number | string | null;
  order_type?: string | null;
  table_name?: string | null;
  document_title?: string | null;
  is_offline_unsynced?: boolean;
  is_reprint?: boolean;
  show_subtotal?: boolean;
  items: ReceiptPrintItem[];
  subtotal: number;
  discount: number;
  tax: number;
  delivery_fee?: number;
  total: number;
  paid: number;
  change?: number;
  balance?: number;
  payment_type: string;
  payment_breakdown?: ReceiptPaymentBreakdownLine[];
  coupon_label?: string | null;
  coupon_code?: string | null;
  coupon_discount?: number;
  notes?: string | null;
  logo_uri?: string | null;
  _printSettings?: import('@/utils/branchPrintSettings').BranchPrintSettingsNormalized;
};

export type KitchenTicketItem = {
  name: string;
  quantity: number;
  modifiers?: string[];
  notes?: string;
  category_name?: string | null;
  options?: ReceiptLineOptionGroup[];
};

export type KitchenTicketPayload = {
  order_label: string;
  store_name?: string;
  print_sequence?: number | string | null;
  invoice_number?: string | null;
  cashier_name?: string | null;
  date?: string | null;
  order_type?: string | null;
  table_name?: string | null;
  route_label?: string | null;
  kitchen_notes?: string | null;
  system_ref?: string | null;
  items: KitchenTicketItem[];
  is_reprint?: boolean;
  ticket_type?: 'kitchen' | 'bar';
};

export type ShiftCloseSectionRow = {
  label: string;
  value: string;
  bold?: boolean;
};

export type ShiftCloseReportPayload = {
  branch_name?: string;
  shift_label: string;
  shift_no?: string | null;
  cashier_name?: string | null;
  vault_name?: string | null;
  opened_at?: string;
  closed_at?: string;
  status?: string;
  opening_balance?: string;
  sections: Array<{
    title: string;
    rows: ShiftCloseSectionRow[];
    lineItems?: Array<{ primary: string; secondary?: string; amount?: string }>;
  }>;
  developer_footer?: string;
};

/** @deprecated Use ShiftCloseReportPayload — kept for queue compat during migration. */
export type ShiftSummaryPayload = ShiftCloseReportPayload;

export type PrintCaptureKind = 'receipt' | 'kitchen' | 'shift';

export type PrintCaptureJob =
  | { kind: 'receipt'; payload: ReceiptPrintPayload; profile: PrinterProfile }
  | { kind: 'kitchen'; payload: KitchenTicketPayload; profile: PrinterProfile }
  | { kind: 'shift'; payload: ShiftCloseReportPayload; profile: PrinterProfile };
