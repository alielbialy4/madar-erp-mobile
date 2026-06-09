import { shiftsAPI } from '@/api/shifts';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { usePosStore } from '@/store/posStore';
import { extractData } from '@/utils/data';
import { normalizeBranchPrintSettings } from '@/utils/branchPrintSettings';
import type { ShiftCloseReportPayload } from '@/types/printing';
import { getConnectionCapability } from './printerCapabilities';
import { resolveReceiptProfile } from './branchPrintBinding';
import { getEnabledProfilesByRole } from './printerProfiles';
import { printEngine } from './printEngine';
import { mapShiftSummaryToPrintPayload } from './mapShiftSummaryToPrintPayload';

export type ShiftPrintResult = { ok: boolean; message: string; jobId?: string };

async function resolveShiftPrintProfile(branchId: string, catalogSettings: Record<string, unknown>) {
  const serverProfileId = String(catalogSettings.customer_printer_profile_id ?? '');
  const receiptProfile = await resolveReceiptProfile(branchId, serverProfileId || null);
  if (receiptProfile) return receiptProfile;
  const shiftProfiles = await getEnabledProfilesByRole('shift', branchId);
  if (shiftProfiles[0]) return shiftProfiles[0];
  const reportProfiles = await getEnabledProfilesByRole('report', branchId);
  if (reportProfiles[0]) return reportProfiles[0];
  const cashierProfiles = await getEnabledProfilesByRole('cashier', branchId);
  return cashierProfiles[0] ?? null;
}

export async function printShiftSummaryForShift(shiftId: string): Promise<ShiftPrintResult> {
  const catalogSettings = usePosStore.getState().catalogSettings;
  const printSettings = normalizeBranchPrintSettings(catalogSettings);
  if (!printSettings.print_shift_close_report) {
    return { ok: true, message: 'طباعة تقرير الوردية معطّلة في إعدادات الفرع.' };
  }

  const branch = useBranchStore.getState().activeBranch;
  const profile = branch?.id
    ? await resolveShiftPrintProfile(branch.id, catalogSettings)
    : null;
  if (!profile) {
    return { ok: false, message: 'لم يتم إعداد طابعة لتقرير الوردية.' };
  }
  const cap = getConnectionCapability(profile.connection_type);
  if (!cap.supported) {
    return { ok: false, message: cap.reasonAr ?? 'نوع الطباعة غير مدعوم على هذا الجهاز.' };
  }

  let payload: ShiftCloseReportPayload;
  try {
    const res = await shiftsAPI.getSummary(shiftId, branch?.id ? { branch_id: branch.id } : undefined);
    const raw = (extractData<Record<string, unknown>>(res) ?? {}) as Record<string, unknown>;
    payload = mapShiftSummaryToPrintPayload(raw, branch?.name);
    const user = useAuthStore.getState().user;
    if (user?.name && !payload.cashier_name) {
      payload = { ...payload, cashier_name: user.name };
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'تعذر تحميل ملخص الوردية' };
  }

  try {
    const job = await printEngine.printShiftSummary(payload, profile);
    if (job.status === 'printed') {
      return { ok: true, message: 'تم إرسال تقرير الوردية للطابعة', jobId: job.id };
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
