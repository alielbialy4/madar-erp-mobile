import { shiftsAPI } from '@/api/shifts';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { extractData } from '@/utils/data';
import { money, numberText, dateText } from '@/utils/format';
import type { ShiftSummaryPayload } from '@/types/printing';
import { getConnectionCapability } from './printerCapabilities';
import { getEnabledProfilesByRole } from './printerProfiles';
import { printEngine } from './printEngine';

export type ShiftPrintResult = { ok: boolean; message: string; jobId?: string };

export async function printShiftSummaryForShift(shiftId: string): Promise<ShiftPrintResult> {
  const profiles = await getEnabledProfilesByRole('shift');
  const fallback = profiles.length ? profiles : await getEnabledProfilesByRole('report');
  const profile = fallback[0] ?? (await getEnabledProfilesByRole('cashier'))[0];
  if (!profile) {
    return { ok: false, message: 'لم يتم إعداد طابعة لملخص الوردية.' };
  }
  const cap = getConnectionCapability(profile.connection_type);
  if (!cap.supported) {
    return { ok: false, message: cap.reasonAr ?? 'نوع الطباعة غير مدعوم على هذا الجهاز.' };
  }

  const branch = useBranchStore.getState().activeBranch;
  const user = useAuthStore.getState().user;
  let summary: Record<string, unknown> = {};
  try {
    const res = await shiftsAPI.getSummary(shiftId, branch?.id ? { branch_id: branch.id } : undefined);
    summary = (extractData<Record<string, unknown>>(res) ?? {}) as Record<string, unknown>;
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذر تحميل ملخص الوردية' };
  }

  const shift = (summary.shift ?? summary) as Record<string, unknown>;
  const totals = (summary.totals ?? summary) as Record<string, unknown>;
  const payload: ShiftSummaryPayload = {
    branch_name: branch?.name,
    shift_label: `وردية ${shift.shift_no ?? shift.id ?? shiftId}`,
    opened_at: shift.opened_at ? dateText(String(shift.opened_at)) : undefined,
    closed_at: shift.closed_at ? dateText(String(shift.closed_at)) : undefined,
    totals: [
      { label: 'إجمالي المبيعات', value: money(totals.gross_sales ?? totals.total_sales ?? totals.sales_total ?? 0) },
      { label: 'مبيعات نقدية', value: money(totals.cash_sales ?? 0) },
      ...(Number(totals.card_payments ?? 0) > 0
        ? [{ label: 'بطاقات', value: money(totals.card_payments ?? 0) }]
        : []),
      { label: 'إنستا باي', value: money(totals.instapay_payments ?? 0) },
      { label: 'محافظ إلكترونية', value: money(totals.electronic_wallet_payments ?? 0) },
      { label: 'المصروفات', value: money(totals.total_expenses ?? 0) },
      { label: 'المرتجعات', value: money(totals.total_refunds ?? totals.refunds_total ?? 0) },
      { label: 'النقدية المتوقعة (الدرج)', value: money(totals.expected_cash ?? shift.expected_cash ?? 0) },
      { label: 'النقدية الفعلية', value: money(totals.actual_cash ?? shift.actual_cash ?? '—') },
      { label: 'الفرق', value: money(totals.discrepancy ?? shift.discrepancy ?? 0) },
      { label: 'عدد العمليات', value: numberText(totals.total_transactions ?? totals.sales_count ?? 0) },
      { label: 'الكاشير', value: String(user?.name ?? shift.cashier_name ?? '—') },
    ],
  };

  try {
    const job = await printEngine.printShiftSummary(payload, profile);
    if (job.status === 'printed') {
      return { ok: true, message: 'تم إرسال ملخص الوردية للطابعة', jobId: job.id };
    }
    return {
      ok: false,
      message: job.error_message ?? 'فشلت الطباعة — راجع قائمة انتظار الطباعة لإعادة المحاولة',
      jobId: job.id,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'فشلت الطباعة' };
  }
}
