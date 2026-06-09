import type { CartLine } from '@/store/posStore';
import { resolveReceiptProfile } from '@/services/printing/branchPrintBinding';
import { printEngine } from '@/services/printing/printEngine';
import { mapCartToTablePreInvoicePayload } from '@/services/printing/receiptMappers';

type ProductRef = { id: number; name: string; category_id?: number | null };
type CategoryRef = { id: number; name: string };

export async function printTablePreInvoiceFromCart(input: {
  branchId: string;
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
  documentTitle?: string;
}): Promise<{ ok: boolean; message: string }> {
  const serverProfileId = String(input.catalogSettings.customer_printer_profile_id ?? '');
  const profile = await resolveReceiptProfile(input.branchId, serverProfileId || null);
  if (!profile) {
    return { ok: false, message: 'لم تُحدَّد طابعة إيصال على هذا الجهاز.' };
  }
  const payload = mapCartToTablePreInvoicePayload({
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
    tableName: input.tableName,
    printSequence: input.printSequence,
    invoiceNumber: input.invoiceNumber,
    documentTitle: input.documentTitle ?? 'فاتورة طاولة',
  });
  try {
    const job = await printEngine.printReceipt(payload, profile);
    if (job.status === 'printed') {
      return { ok: true, message: 'تم إرسال فاتورة الطاولة للطابعة' };
    }
    return { ok: false, message: job.error_message ?? 'فشلت الطباعة' };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'فشلت الطباعة' };
  }
}
