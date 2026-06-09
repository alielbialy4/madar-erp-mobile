import type { PrinterProfile, ShiftCloseReportPayload } from '@/types/printing';
import { EscPosBuilder, charsForPaper } from './escposBuilder';

function effectiveEncoding(profile: PrinterProfile) {
  return profile.encoding === 'utf8_image' ? 'windows1256' : profile.encoding;
}

export function buildShiftSummaryTextLines(payload: ShiftCloseReportPayload): string[] {
  const lines: string[] = ['تقرير إغلاق الوردية'];
  if (payload.branch_name) lines.push(payload.branch_name);
  lines.push(payload.shift_label);
  if (payload.opened_at) lines.push(`فتح: ${payload.opened_at}`);
  if (payload.closed_at) lines.push(`إغلاق: ${payload.closed_at}`);
  lines.push('--------------------------------');
  for (const section of payload.sections) {
    lines.push(`== ${section.title} ==`);
    for (const row of section.rows) {
      lines.push(`${row.label}: ${row.value}`);
    }
    for (const line of section.lineItems ?? []) {
      lines.push(`${line.primary}${line.amount ? ` — ${line.amount}` : ''}`);
      if (line.secondary) lines.push(`  ${line.secondary}`);
    }
  }
  lines.push('--------------------------------');
  lines.push(new Date().toLocaleString('ar-EG-u-nu-latn'));
  return lines;
}

export function buildShiftSummaryEscPos(payload: ShiftCloseReportPayload, profile: PrinterProfile): Uint8Array {
  const cols = profile.characters_per_line || charsForPaper(profile.paper_width);
  const enc = effectiveEncoding(profile);
  const b = EscPosBuilder.forProfile(profile)
    .init()
    .codePage(enc)
    .align('center')
    .bold(true)
    .size(true, true)
    .textLine('تقرير إغلاق الوردية', cols, enc)
    .size(false, false)
    .bold(false)
    .align('left');

  if (payload.branch_name) b.textLine(payload.branch_name, cols, enc);
  b.textLine(payload.shift_label, cols, enc);
  if (payload.opened_at) b.textLine(`فتح: ${payload.opened_at}`, cols, enc);
  if (payload.closed_at) b.textLine(`إغلاق: ${payload.closed_at}`, cols, enc);
  if (payload.cashier_name) b.textLine(`الكاشير: ${payload.cashier_name}`, cols, enc);
  b.separator(cols);

  for (const section of payload.sections) {
    b.bold(true).textLine(section.title, cols, enc).bold(false);
    for (const row of section.rows) {
      b.textLine(`${row.label}: ${row.value}`, cols, enc);
    }
    for (const line of section.lineItems ?? []) {
      b.textLine(line.primary, cols, enc);
      if (line.secondary) b.textLine(`  ${line.secondary}`, cols, enc);
      if (line.amount) b.textLine(`  ${line.amount}`, cols, enc);
    }
    b.separator(cols);
  }

  if (payload.developer_footer) {
    b.align('center').textLine(payload.developer_footer, cols, enc).align('left');
  }
  b.feed(2);
  if (profile.cut_paper) b.cut();
  return b.build();
}
