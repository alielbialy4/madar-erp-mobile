import type { PrinterProfile, ReceiptPrintPayload } from '@/types/printing';
import { EscPosBuilder, charsForPaper } from './escposBuilder';

export function buildReceiptEscPos(payload: ReceiptPrintPayload, profile: PrinterProfile): Uint8Array {
  const cols = profile.characters_per_line || charsForPaper(profile.paper_width);
  const b = new EscPosBuilder().init().codePage(profile.encoding).align('center').bold(true).size(true, true);
  b.textLine(payload.branch_name ?? 'Madar ERP', cols).size(false, false).bold(false).align('left');

  if (payload.is_offline_unsynced) {
    b.bold(true).textLine('*** غير مزامنة ***', cols).bold(false);
    b.textLine('لم تتم مزامنة هذه الفاتورة بعد', cols);
  }

  if (payload.local_order_id) b.textLine(`محلي: ${payload.local_order_id}`, cols);
  if (payload.server_invoice_number) b.textLine(`فاتورة: ${payload.server_invoice_number}`, cols);
  if (payload.is_reprint) b.textLine('--- إعادة طباعة ---', cols);

  b.separator(cols);
  b.textLine(`التاريخ: ${payload.date}`, cols);
  if (payload.cashier_name) b.textLine(`الكاشير: ${payload.cashier_name}`, cols);
  b.separator(cols);

  for (const item of payload.items) {
    b.textLine(`${item.name} x${item.quantity}`, cols);
    const lineTotal = item.quantity * item.unit_price - (item.discount ?? 0);
    b.textLine(`${lineTotal.toFixed(2)}`, cols);
    if (item.notes) b.textLine(`  ${item.notes}`, cols);
  }

  b.separator(cols);
  b.textLine(`المجموع: ${payload.subtotal.toFixed(2)}`, cols);
  if (payload.discount > 0) b.textLine(`خصم: ${payload.discount.toFixed(2)}`, cols);
  if (payload.tax > 0) b.textLine(`ضريبة: ${payload.tax.toFixed(2)}`, cols);
  if (payload.coupon_label) b.textLine(`كوبون: ${payload.coupon_label}`, cols);
  b.bold(true).textLine(`الإجمالي: ${payload.total.toFixed(2)}`, cols).bold(false);
  b.textLine(`المدفوع: ${payload.paid.toFixed(2)} (${payload.payment_type})`, cols);
  if (payload.notes) b.textLine(`ملاحظات: ${payload.notes}`, cols);

  b.feed(2);
  if (profile.cut_paper) b.cut();
  return b.build();
}

export function buildArabicTestEscPos(profile: PrinterProfile): Uint8Array {
  const cols = profile.characters_per_line || charsForPaper(profile.paper_width);
  const b = new EscPosBuilder().init().codePage(profile.encoding).align('center').bold(true);
  b.textLine('فاتورة بيع', cols);
  b.textLine('منتج تجريبي', cols);
  b.textLine('الإجمالي 123.45 ج.م', cols);
  b.textLine('رقم الفاتورة', cols);
  b.textLine(new Date().toLocaleString('ar-EG-u-nu-latn'), cols);
  b.feed(2);
  if (profile.cut_paper) b.cut();
  return b.build();
}

export function buildTestPageEscPos(profile: PrinterProfile): Uint8Array {
  const cols = profile.characters_per_line || charsForPaper(profile.paper_width);
  const b = new EscPosBuilder().init().align('center').bold(true);
  b.textLine('Madar ERP — Test Print', cols);
  b.textLine(profile.name, cols).bold(false).align('left');
  b.textLine(`Connection: ${profile.connection_type}`, cols);
  b.textLine(`Paper: ${profile.paper_width}`, cols);
  b.textLine(`IP: ${profile.ip ?? '-'}:${profile.port}`, cols);
  b.feed(2);
  if (profile.cut_paper) b.cut();
  return b.build();
}
