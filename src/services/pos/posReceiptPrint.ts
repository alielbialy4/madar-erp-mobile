import { posAPI } from '@/api/pos';
import { resolveReceiptProfile } from '@/services/printing/branchPrintBinding';
import { printEngine } from '@/services/printing/printEngine';
import { mapSalePrintResponseToPayload } from '@/services/printing/receiptMappers';
import { extractData } from '@/utils/data';

export async function printSaleReceiptLocal(
  saleId: number,
  branchId: string,
  options?: {
    isReprint?: boolean;
    documentTitle?: string;
    showBarcode?: boolean;
    asRefund?: boolean;
    mode?: 'original' | 'return' | 'current';
    refundId?: number;
  },
): Promise<{ ok: boolean; message: string }> {
  try {
    const params: Record<string, string | number> = {};
    const mode = options?.mode ?? (options?.asRefund ? 'return' : 'original');
    params.mode = mode;
    if (options?.refundId != null) params.refund_id = options.refundId;

    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    const path = `/pos/sales/${saleId}/print${query ? `?${query}` : ''}`;

    const res = await posAPI.printSaleRaw(path) as import('@/types/api').ApiEnvelope<{
      sale?: Record<string, unknown>;
      store?: Record<string, unknown>;
      receipt?: Record<string, unknown>;
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
      receipt: (data.receipt as any) ?? null,
    });
    const job = mode === 'return' || options?.asRefund
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
