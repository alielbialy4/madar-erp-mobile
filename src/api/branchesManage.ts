import { del, get, patch, post, put, postMultipart } from './client';
import { appendPickedImage } from './formData';
import type { ListParams } from '@/types/api';
import type { BranchManageRow, BranchSummary } from '@/types/branches';
import type { PickedImage } from '@/types/api';

export type BranchSettingsPatch = {
  auto_print_receipt?: boolean;
  enable_kitchen_print?: boolean;
  use_server_kitchen_print_queue?: boolean;
  receipt_show_invoice_number?: boolean;
  receipt_show_invoice_barcode?: boolean;
  receipt_show_product_category?: boolean;
  receipt_show_print_sequence?: boolean;
  receipt_show_branch_name?: boolean;
  print_shift_close_report?: boolean;
  customer_printer_name?: string | null;
  print_sequence_max?: number | null;
  receipt_footer?: string | null;
  customer_receipt_footer_message?: string | null;
  customer_receipt_developer_footer?: string | null;
  receipt_logo_url?: string | null;
  receipt_header?: string | null;
  receipt_address?: string | null;
  receipt_phone?: string | null;
  receipt_email?: string | null;
  receipt_return_policy?: string | null;
  tax_enabled?: boolean;
  tax_rate?: number;
  tax_name?: string;
  tax_inclusive?: boolean;
  service_charge_enabled?: boolean;
  service_charge_type?: 'percentage' | 'fixed';
  service_charge_value?: number;
  service_charge_apply_to?: 'dine_in' | 'delivery' | 'takeaway' | 'all';
  service_charge_label?: string;
  allow_pos_discount?: boolean;
  allow_pos_coupon?: boolean;
  customer_receipt_font_size?: number;
  kitchen_ticket_font_size?: number;
};

export const branchesManageAPI = {
  list: (params?: ListParams) => get<BranchManageRow[]>('/branches', params),
  get: (id: string) => get<BranchManageRow>(`/branches/${id}`),
  create: (payload: Record<string, unknown>) => post<BranchManageRow>('/branches', payload),
  update: (id: string, payload: Record<string, unknown>) => put<BranchManageRow>(`/branches/${id}`, payload),
  delete: (id: string) => del(`/branches/${id}`),
  updateStatus: (id: string, status: string) => patch(`/branches/${id}/status`, { status }),
  summary: (id: string) => get<BranchSummary>(`/branches/${id}/summary`),
  patchSettings: (id: string, settings: BranchSettingsPatch) =>
    patch<{ id: string; settings: Record<string, unknown> }>(`/branches/${id}/settings`, { settings }),
  uploadReceiptLogo: (id: string, image: PickedImage) => {
    const formData = new FormData();
    appendPickedImage(formData, 'logo', image);
    return postMultipart<{ logo_url?: string }>(`/branches/${id}/settings/logo`, formData);
  },
};
