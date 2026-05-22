import type { PrinterProfile, ShiftSummaryPayload } from '@/types/printing';
import { EscPosBuilder, charsForPaper } from './escposBuilder';

export function buildShiftSummaryEscPos(payload: ShiftSummaryPayload, profile: PrinterProfile): Uint8Array {
  const cols = profile.characters_per_line || charsForPaper(profile.paper_width);
  const b = new EscPosBuilder()
    .init()
    .codePage(profile.encoding)
    .align('center')
    .bold(true)
    .size(true, true)
    .textLine('ملخص الوردية', cols)
    .size(false, false)
    .bold(false)
    .align('left');

  if (payload.branch_name) b.textLine(payload.branch_name, cols);
  b.textLine(payload.shift_label, cols);
  if (payload.opened_at) b.textLine(`فتح: ${payload.opened_at}`, cols);
  if (payload.closed_at) b.textLine(`إغلاق: ${payload.closed_at}`, cols);
  b.separator(cols);

  for (const row of payload.totals) {
    b.textLine(`${row.label}: ${row.value}`, cols);
  }

  b.separator(cols);
  b.textLine(new Date().toLocaleString('ar-EG-u-nu-latn'), cols);
  if (profile.cut_paper) b.cut();
  return b.build();
}
