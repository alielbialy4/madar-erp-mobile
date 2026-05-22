import type { KitchenTicketPayload, PrinterProfile } from '@/types/printing';
import { EscPosBuilder, charsForPaper } from './escposBuilder';

export function buildKitchenTicketEscPos(payload: KitchenTicketPayload, profile: PrinterProfile): Uint8Array {
  const cols = profile.characters_per_line || charsForPaper(profile.paper_width);
  const b = new EscPosBuilder().init().align('center').bold(true).size(true, true);
  const title = payload.ticket_type === 'bar' ? 'BAR' : 'KITCHEN';
  b.textLine(title, cols).size(false, false);
  b.textLine(payload.order_label, cols);
  if (payload.is_reprint) b.textLine('*** REPRINT ***', cols);
  if (payload.table_name) b.textLine(`Table: ${payload.table_name}`, cols);
  b.bold(false).align('left').separator(cols);

  for (const item of payload.items) {
    b.bold(true).textLine(`${item.quantity}x ${item.name}`, cols).bold(false);
    if (item.modifiers?.length) {
      for (const mod of item.modifiers) b.textLine(`  + ${mod}`, cols);
    }
    if (item.notes) b.textLine(`  Note: ${item.notes}`, cols);
  }

  b.feed(3);
  if (profile.cut_paper) b.cut();
  return b.build();
}
