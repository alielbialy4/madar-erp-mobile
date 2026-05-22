export type PrinterConnectionType =
  | 'network_tcp'
  | 'bluetooth_android'
  | 'airprint_ios'
  | 'vendor_sdk'
  | 'disabled';

export type PrinterRole = 'cashier' | 'kitchen' | 'bar' | 'shift' | 'report';
export type PaperWidth = '58mm' | '80mm';
export type PrinterMode = 'escpos_text' | 'escpos_image' | 'airprint';
export type EscPosEncoding = 'cp864' | 'cp720' | 'windows1256' | 'utf8_image';

export type PrinterProfile = {
  id: string;
  name: string;
  role: PrinterRole;
  connection_type: PrinterConnectionType;
  paper_width: PaperWidth;
  ip?: string;
  port: number;
  bluetoothAddress?: string;
  airprintName?: string;
  mode: PrinterMode;
  encoding: EscPosEncoding;
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
  printed_at?: string | null;
};

export type ReceiptPrintPayload = {
  branch_name?: string;
  cashier_name?: string;
  date: string;
  local_order_id?: string | null;
  server_invoice_number?: string | null;
  is_offline_unsynced?: boolean;
  is_reprint?: boolean;
  items: { name: string; quantity: number; unit_price: number; discount?: number; notes?: string }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  payment_type: string;
  coupon_label?: string | null;
  notes?: string | null;
};

export type KitchenTicketPayload = {
  order_label: string;
  table_name?: string | null;
  items: { name: string; quantity: number; modifiers?: string[]; notes?: string }[];
  is_reprint?: boolean;
  ticket_type?: 'kitchen' | 'bar';
};

export type ShiftSummaryPayload = {
  branch_name?: string;
  shift_label: string;
  opened_at?: string;
  closed_at?: string;
  totals: { label: string; value: string }[];
};
