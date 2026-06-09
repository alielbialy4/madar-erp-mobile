import type { KitchenTicketPayload, PrinterProfile } from '@/types/printing';
import { kitchenPrintLabels } from '@/constants/printLabels';
import { EscPosBuilder, charsForPaper } from './escposBuilder';

function effectiveEncoding(profile: PrinterProfile) {
  return profile.encoding === 'utf8_image' ? 'windows1256' : profile.encoding;
}

export function buildKitchenTicketTextLines(payload: KitchenTicketPayload): string[] {
  const title = payload.ticket_type === 'bar' ? kitchenPrintLabels.bar : kitchenPrintLabels.kitchen;
  const lines: string[] = [];
  if (payload.store_name) lines.push(payload.store_name);
  if (payload.is_reprint) lines.push(`*** ${kitchenPrintLabels.reprint} ***`);
  lines.push(title);
  if (payload.print_sequence != null) {
    lines.push(`${kitchenPrintLabels.orderNumber}: ${payload.print_sequence}`);
  }
  if (payload.invoice_number) {
    lines.push(`${kitchenPrintLabels.invoiceNumber}: ${payload.invoice_number}`);
  }
  lines.push(payload.order_label);
  if (payload.table_name) lines.push(`${kitchenPrintLabels.table}: ${payload.table_name}`);
  if (payload.date) lines.push(`${kitchenPrintLabels.date}: ${payload.date}`);
  lines.push('--------------------------------');
  for (const item of payload.items) {
    lines.push(`${item.quantity}x ${item.name}`);
    item.modifiers?.forEach((m) => lines.push(`  + ${m}`));
    if (item.notes) lines.push(`  ${item.notes}`);
  }
  return lines;
}

export function buildKitchenTicketEscPos(payload: KitchenTicketPayload, profile: PrinterProfile): Uint8Array {
  const cols = profile.characters_per_line || charsForPaper(profile.paper_width);
  const enc = effectiveEncoding(profile);
  const title = payload.ticket_type === 'bar' ? kitchenPrintLabels.bar : kitchenPrintLabels.kitchen;
  const b = EscPosBuilder.forProfile(profile).init().codePage(enc).align('center').bold(true);

  if (payload.store_name) {
    b.textLine(payload.store_name, cols, enc);
  }
  if (payload.is_reprint) {
    b.textLine(`*** ${kitchenPrintLabels.reprint} ***`, cols, enc);
  }
  b.textLine(title, cols, enc).bold(false).align('left');

  if (payload.print_sequence != null) {
    b.textLine(`${kitchenPrintLabels.orderNumber}: ${payload.print_sequence}`, cols, enc);
  }
  if (payload.invoice_number) {
    b.textLine(`${kitchenPrintLabels.invoiceNumber}: ${payload.invoice_number}`, cols, enc);
  }
  b.textLine(payload.order_label, cols, enc);
  if (payload.table_name) b.textLine(`${kitchenPrintLabels.table}: ${payload.table_name}`, cols, enc);
  if (payload.date) b.textLine(`${kitchenPrintLabels.date}: ${payload.date}`, cols, enc);
  if (payload.cashier_name) b.textLine(`${kitchenPrintLabels.cashier}: ${payload.cashier_name}`, cols, enc);
  if (payload.route_label) b.textLine(`${kitchenPrintLabels.route}: ${payload.route_label}`, cols, enc);
  b.separator(cols);

  for (const item of payload.items) {
    b.textLine(`${item.quantity}x ${item.name}`, cols, enc);
    item.modifiers?.forEach((m) => b.textLine(`  + ${m}`, cols, enc));
    if (item.notes) b.textLine(`  ${item.notes}`, cols, enc);
  }

  b.feed(2);
  if (profile.cut_paper) b.cut();
  return b.build();
}
