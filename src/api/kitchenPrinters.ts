import { del, get, post, put } from './client';
import { extractArray, extractData } from '@/utils/data';

export type KitchenPrinter = {
  id: string;
  branch_id: string | null;
  name: string;
  printer_name: string;
  is_active: boolean;
  auto_print_enabled: boolean;
  copies_count: number;
  sort_order: number;
  notes: string | null;
};

export type KitchenPrinterPayload = {
  branch_id?: string;
  name: string;
  printer_name: string;
  is_active?: boolean;
  auto_print_enabled?: boolean;
  copies_count?: number;
  sort_order?: number;
  notes?: string | null;
};

export const kitchenPrintersAPI = {
  async list(branchId: string): Promise<KitchenPrinter[]> {
    const res = await get<KitchenPrinter[]>('/kitchen-printers', { branch_id: branchId });
    return extractArray<KitchenPrinter>(res);
  },

  async create(payload: KitchenPrinterPayload): Promise<KitchenPrinter> {
    const res = await post<KitchenPrinter>('/kitchen-printers', payload);
    return extractData(res) as KitchenPrinter;
  },

  async update(id: string, payload: Partial<KitchenPrinterPayload>): Promise<KitchenPrinter> {
    const res = await put<KitchenPrinter>(`/kitchen-printers/${id}`, payload);
    return extractData(res) as KitchenPrinter;
  },

  async remove(id: string): Promise<void> {
    await del(`/kitchen-printers/${id}`);
  },
};
