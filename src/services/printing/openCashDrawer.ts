import { resolveReceiptProfile } from './branchPrintBinding';
import { EscPosBuilder } from './escposBuilder';
import { sendRawEscPos } from './printEngine';

export type OpenCashDrawerInput = {
  branchId?: string | null;
  catalogSettings?: Record<string, unknown>;
};

export async function openCashDrawer(input: OpenCashDrawerInput): Promise<void> {
  const branchId = input.branchId?.trim();
  if (!branchId) {
    throw new Error('اختر فرعاً أولاً.');
  }

  const catalogSettings = input.catalogSettings ?? {};
  const serverProfileId = String(catalogSettings.customer_printer_profile_id ?? '');
  const profile = await resolveReceiptProfile(branchId, serverProfileId || null);
  if (!profile) {
    throw new Error('لم يتم إعداد طابعة الكاشير. راجع إعدادات طباعة الفرع.');
  }

  const buffer = new EscPosBuilder().pulseDrawer().build();
  await sendRawEscPos(profile, buffer);
}
