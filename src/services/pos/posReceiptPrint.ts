import { posAPI } from '@/api/pos';
import { resolveReceiptProfile } from '@/services/printing/branchPrintBinding';
import { printEngine } from '@/services/printing/printEngine';
import { mapSalePrintResponseToPayload } from '@/services/printing/receiptMappers';
import { extractData } from '@/utils/data';

export async function printSaleReceiptLocal(
  saleId: number,
  branchId: string,
  options?: { isReprint?: boolean; documentTitle?: string; showBarcode?: boolean; asRefund?: boolean },
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await posAPI.printSale(saleId) as import('@/types/api').ApiEnvelope<{
      sale?: Record<string, unknown>;
      store?: Record<string, unknown>;
    }>;
    const data = extractData(res);
    if (!data?.sale || !data?.store) {
      return { ok: false, message: 'تعذر تحميل بيانات الفاتورة للطباعة' };
    }
    const catalogSettings = data.store as Record<string, unknown>;
    const serverProfileId = String(catalogSettings.customer_printer_profile_id ?? '');
    const profile = await resolveReceiptProfile(branchId, serverProfileId || null);
    if (!profile) {
      return { ok: false, message: 'لم تُحدَّد طابعة إيصال على هذا الجهاز.' };
    }
    const payload = mapSalePrintResponseToPayload(data.sale, data.store, {
      isReprint: options?.isReprint ?? true,
      documentTitle: options?.documentTitle,
      showBarcode: options?.showBarcode,
    });
    const job = options?.asRefund
      ? await printEngine.printRefundReceipt(payload, profile)
      : await printEngine.printReceipt(payload, profile);
    if (job.status === 'printed') {
      return { ok: true, message: 'تم إرسال الفاتورة للطابعة' };
    }
    return {
      ok: false,
      message: job.error_message ?? 'فشلت الطباعة — راجع قائمة انتظار الطباعة',
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'فشلت الطباعة' };
  }
}
