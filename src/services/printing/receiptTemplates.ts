import { buildReceiptViewModel } from './buildReceiptViewModel';
import { receiptRasterFontBoost } from '@/constants/receiptPrintTokens';
import type { EscPosEncoding, PrinterProfile, ReceiptPrintPayload } from '@/types/printing';
import type { BranchPrintSettingsNormalized } from '@/utils/branchPrintSettings';
import { paymentTypeLabel } from '@/utils/paymentLabels';
import { EscPosBuilder, charsForPaper } from './escposBuilder';
import {
  CP864_CODE_PAGE_CANDIDATES,
  WINDOWS1256_CODE_PAGE_CANDIDATES,
} from './codePageTables';

function effectiveTextEncoding(profile: PrinterProfile): EscPosEncoding {
  if (profile.encoding === 'utf8_image') return 'windows1256';
  return profile.encoding;
}

function fontScale(size: number, paperWidth: PrinterProfile['paper_width']): { w: boolean; h: boolean } {
  const boosted = size * receiptRasterFontBoost(paperWidth);
  if (boosted >= 14) return { w: true, h: true };
  if (boosted >= 10) return { w: true, h: false };
  return { w: false, h: false };
}

function bodyFontScale(size: number, paperWidth: PrinterProfile['paper_width']): { w: boolean; h: boolean } {
  const boosted = size * receiptRasterFontBoost(paperWidth);
  if (boosted >= 18) return { w: true, h: true };
  if (boosted >= 8) return { w: true, h: false };
  return { w: false, h: false };
}

function applyBrandedHeader(
  b: EscPosBuilder,
  cols: number,
  enc: PrinterProfile['encoding'],
  brand: BranchPrintSettingsNormalized,
  payload: ReceiptPrintPayload,
  paperWidth: PrinterProfile['paper_width'],
): void {
  const scale = fontScale(brand.customer_receipt_font_size, paperWidth);
  b.align('center').bold(true).size(scale.w, scale.h);
  if (brand.receipt_header.trim()) {
    b.textLine(brand.receipt_header.trim(), cols, enc);
  } else {
    b.textLine(payload.branch_name ?? 'Madar ERP', cols, enc);
  }
  b.size(false, false).bold(false);
  if (brand.receipt_address.trim()) b.textLine(brand.receipt_address.trim(), cols, enc);
  if (brand.receipt_phone.trim()) b.textLine(`هاتف: ${brand.receipt_phone.trim()}`, cols, enc);
  if (brand.receipt_email.trim()) b.textLine(brand.receipt_email.trim(), cols, enc);
}

function applyBrandedFooter(
  b: EscPosBuilder,
  cols: number,
  enc: PrinterProfile['encoding'],
  brand: BranchPrintSettingsNormalized,
): void {
  b.separator(cols);
  b.align('center');
  if (brand.customer_receipt_footer_message.trim()) {
    b.textLine(brand.customer_receipt_footer_message.trim(), cols, enc);
  }
  if (brand.receipt_return_policy.trim()) {
    b.textLine(brand.receipt_return_policy.trim(), cols, enc);
  }
  if (brand.customer_receipt_developer_footer.trim()) {
    b.textLine(brand.customer_receipt_developer_footer.trim(), cols, enc);
  }
  b.align('left');
}

export function buildReceiptTextLines(payload: ReceiptPrintPayload, profile: PrinterProfile): string[] {
  const vm = buildReceiptViewModel(payload);
  const lines: string[] = [];
  if (vm.headerNote) lines.push(vm.headerNote);
  else if (vm.storeName) lines.push(vm.storeName);
  if (vm.address) lines.push(vm.address);
  if (vm.phone) lines.push(`هاتف: ${vm.phone}`);
  if (vm.isOffline) lines.push('*** غير مزامنة ***');
  if (vm.documentTitle) lines.push(vm.documentTitle);
  if (vm.showInvoiceInMeta && vm.invoiceNumber) lines.push(`${vm.labels.invoice}: ${vm.invoiceNumber}`);
  if (vm.showOrderHero && vm.printSequence) lines.push(`${vm.labels.orderNumber}: ${vm.printSequence}`);
  lines.push(`${vm.labels.date}: ${vm.date}`);
  if (vm.cashierName) lines.push(`${vm.labels.cashier}: ${vm.cashierName}`);
  if (vm.customerName) lines.push(`${vm.labels.customer}: ${vm.customerName}`);
  if (vm.orderContext) lines.push(vm.orderContext);
  lines.push('--------------------------------');
  for (const item of vm.items) {
    lines.push(`${item.name} x${item.quantity}`);
    if (item.category_name && vm.showProductCategory) lines.push(`  ${item.category_name}`);
    lines.push(vm.formatCurrency(item.line_total ?? item.quantity * item.unit_price));
    if (item.notes) lines.push(`  ${item.notes}`);
  }
  lines.push('--------------------------------');
  if (vm.showSubtotal) lines.push(`${vm.labels.subtotal}: ${vm.formatCurrency(vm.subtotal)}`);
  if (vm.discount > 0) lines.push(`${vm.labels.discount}: ${vm.formatCurrency(vm.discount)}`);
  if (vm.couponDiscount > 0) {
    const couponLabel = vm.couponCode
      ? vm.labels.couponWithCode(vm.couponCode)
      : vm.labels.couponIncluded;
    lines.push(`${couponLabel}: -${vm.formatCurrency(vm.couponDiscount)}`);
  }
  if (vm.tax > 0) lines.push(`${vm.labels.tax}: ${vm.formatCurrency(vm.tax)}`);
  if (vm.deliveryFee > 0) lines.push(`${vm.labels.deliveryFee}: ${vm.formatCurrency(vm.deliveryFee)}`);
  lines.push(`${vm.labels.total}: ${vm.formatCurrency(vm.total)}`);
  if (vm.paymentBreakdown.length > 1) {
    for (const line of vm.paymentBreakdown) {
      lines.push(`${line.label}: ${vm.formatCurrency(Number(line.amount))}`);
    }
  } else if (vm.paymentSummary) {
    lines.push(`${vm.labels.paymentType}: ${vm.paymentSummary}`);
  }
  if (vm.showPaid) {
    lines.push(`${vm.labels.paid}: ${vm.formatCurrency(vm.paid)}`);
    if (vm.change > 0) lines.push(`${vm.labels.change}: ${vm.formatCurrency(vm.change)}`);
    if (vm.balance > 0) lines.push(`${vm.labels.balance}: ${vm.formatCurrency(vm.balance)}`);
  }
  if (vm.notes) lines.push(`${vm.labels.notes}: ${vm.notes}`);
  if (vm.footerMessage) lines.push(vm.footerMessage);
  if (vm.returnPolicy) lines.push(vm.returnPolicy);
  if (vm.developerFooter) lines.push(vm.developerFooter);
  return lines;
}

export function buildReceiptEscPos(payload: ReceiptPrintPayload, profile: PrinterProfile): Uint8Array {
  const vm = buildReceiptViewModel(payload);
  const cols = profile.characters_per_line || charsForPaper(profile.paper_width);
  const enc = effectiveTextEncoding(profile);
  const brand = payload._printSettings;
  const receiptFontSize = brand?.customer_receipt_font_size ?? 12;
  const bodyScale = bodyFontScale(receiptFontSize, profile.paper_width);
  const heroScale = fontScale(receiptFontSize, profile.paper_width);
  const b = EscPosBuilder.forProfile(profile).init().codePage(enc);

  if (brand) {
    applyBrandedHeader(b, cols, enc, brand, payload, profile.paper_width);
  } else {
    b.align('center').bold(true).size(true, true);
    b.textLine((vm.storeName || payload.branch_name) ?? 'Madar ERP', cols, enc).size(false, false).bold(false).align('left');
  }

  if (vm.isOffline) {
    b.bold(true).textLine('*** غير مزامنة ***', cols, enc).bold(false);
    b.textLine('لم تتم مزامنة هذه الفاتورة بعد', cols, enc);
  }

  if (payload.local_order_id) b.textLine(`محلي: ${payload.local_order_id}`, cols, enc);
  if (vm.documentTitle) b.textLine(vm.documentTitle, cols, enc);
  if (vm.showInvoiceInMeta && vm.invoiceNumber) {
    b.textLine(`${vm.labels.invoice}: ${vm.invoiceNumber}`, cols, enc);
  }
  if (vm.isReprint) b.textLine('--- إعادة طباعة ---', cols, enc);

  b.separator(cols);
  b.size(bodyScale.w, bodyScale.h);
  if (vm.showOrderHero && vm.printSequence) {
    b.bold(true).size(heroScale.w, heroScale.h);
    b.textLine(`${vm.labels.orderNumber}: ${vm.printSequence}`, cols, enc);
    b.bold(false).size(bodyScale.w, bodyScale.h);
  }
  b.textLine(`${vm.labels.date}: ${vm.date}`, cols, enc);
  if (vm.cashierName) b.textLine(`${vm.labels.cashier}: ${vm.cashierName}`, cols, enc);
  if (vm.customerName) b.textLine(`${vm.labels.customer}: ${vm.customerName}`, cols, enc);
  if (vm.orderContext) b.textLine(vm.orderContext, cols, enc);
  b.separator(cols);

  for (const item of vm.items) {
    b.textLine(`${item.name} x${item.quantity}`, cols, enc);
    const lineTotal = item.line_total ?? item.quantity * item.unit_price - (item.discount ?? 0);
    b.textLine(vm.formatCurrency(lineTotal), cols, enc);
    if (item.notes) b.textLine(`  ${item.notes}`, cols, enc);
  }

  b.separator(cols);
  if (vm.showSubtotal) b.textLine(`${vm.labels.subtotal}: ${vm.formatCurrency(vm.subtotal)}`, cols, enc);
  if (vm.discount > 0) b.textLine(`${vm.labels.discount}: ${vm.formatCurrency(vm.discount)}`, cols, enc);
  if (vm.couponDiscount > 0) {
    const couponLabel = vm.couponCode
      ? vm.labels.couponWithCode(vm.couponCode)
      : vm.labels.couponIncluded;
    b.textLine(`${couponLabel}: -${vm.formatCurrency(vm.couponDiscount)}`, cols, enc);
  }
  if (vm.tax > 0) b.textLine(`${vm.labels.tax}: ${vm.formatCurrency(vm.tax)}`, cols, enc);
  if (vm.deliveryFee > 0) b.textLine(`${vm.labels.deliveryFee}: ${vm.formatCurrency(vm.deliveryFee)}`, cols, enc);
  const totalScale = fontScale(receiptFontSize, profile.paper_width);
  b.bold(true).size(totalScale.w, totalScale.h);
  b.textLine(`${vm.labels.total}: ${vm.formatCurrency(vm.total)}`, cols, enc);
  b.size(bodyScale.w, bodyScale.h).bold(false);
  if (vm.paymentBreakdown.length > 1) {
    for (const line of vm.paymentBreakdown) {
      b.textLine(`${line.label}: ${vm.formatCurrency(Number(line.amount))}`, cols, enc);
    }
  } else {
    b.textLine(
      `${vm.labels.paid}: ${vm.formatCurrency(vm.paid)} (${vm.paymentSummary || paymentTypeLabel(payload.payment_type)})`,
      cols,
      enc,
    );
  }
  if (vm.showPaid && vm.change > 0) b.textLine(`${vm.labels.change}: ${vm.formatCurrency(vm.change)}`, cols, enc);
  if (vm.showPaid && vm.balance > 0) b.textLine(`${vm.labels.balance}: ${vm.formatCurrency(vm.balance)}`, cols, enc);
  if (vm.notes) b.textLine(`${vm.labels.notes}: ${vm.notes}`, cols, enc);

  if (brand) {
    applyBrandedFooter(b, cols, enc, brand);
  }

  b.feed(2);
  if (profile.cut_paper) b.cut();
  return b.build();
}

export function buildArabicTestEscPos(profile: PrinterProfile): Uint8Array {
  const cols = profile.characters_per_line || charsForPaper(profile.paper_width);
  const enc = effectiveTextEncoding(profile);
  const b = EscPosBuilder.forProfile(profile).init().codePage(enc).align('center').bold(true);
  b.textLine('فاتورة بيع', cols, enc);
  b.textLine('منتج تجريبي', cols, enc);
  b.textLine('الإجمالي 123.45 ج.م', cols, enc);
  b.textLine('رقم الفاتورة', cols, enc);
  b.textLine(new Date().toLocaleString('ar-EG-u-nu-latn'), cols, enc);
  b.feed(2);
  if (profile.cut_paper) b.cut();
  return b.build();
}

export function buildCodePageReferenceEscPos(profile: PrinterProfile): Uint8Array {
  const cols = profile.characters_per_line || charsForPaper(profile.paper_width);
  const b = EscPosBuilder.forProfile(profile).init().align('center').bold(true);
  b.textLine('Arabic Code Pages', cols, 'utf8').bold(false).align('left');
  for (const table of WINDOWS1256_CODE_PAGE_CANDIDATES) {
    b.selectCodePageTable(table);
    b.textLinePreservingCodePage(`CP${table} W1256: اختبار عربي`, cols, 'windows1256');
  }
  b.separator(cols);
  for (const table of CP864_CODE_PAGE_CANDIDATES) {
    b.selectCodePageTable(table);
    b.textLinePreservingCodePage(`CP${table} PC864: اختبار عربي`, cols, 'cp864');
    b.separator(cols);
  }
  b.feed(2);
  if (profile.cut_paper) b.cut();
  return b.build();
}

export function buildEncodingTestEscPos(profile: PrinterProfile, sampleEncoding: EscPosEncoding): Uint8Array {
  const cols = profile.characters_per_line || charsForPaper(profile.paper_width);
  const testProfile = { ...profile, encoding: sampleEncoding };
  const enc = effectiveTextEncoding(testProfile);
  const b = EscPosBuilder.forProfile(testProfile).init().align('center').bold(true);

  if (sampleEncoding === 'windows1256') {
    for (const table of WINDOWS1256_CODE_PAGE_CANDIDATES) {
      b.selectCodePageTable(table);
      b.textLinePreservingCodePage(`W1256 CP${table}`, cols, enc);
      b.textLinePreservingCodePage('اختبار الطباعة العربية', cols, enc);
      b.separator(cols);
    }
    b.textLine('English OK', cols, enc);
  } else if (sampleEncoding === 'cp864') {
    for (const table of CP864_CODE_PAGE_CANDIDATES) {
      b.selectCodePageTable(table);
      b.textLinePreservingCodePage(`CP864 CP${table}`, cols, enc);
      b.textLinePreservingCodePage('اختبار الطباعة العربية', cols, enc);
      b.separator(cols);
    }
    b.textLine('English OK', cols, enc);
  } else {
    b.codePage(enc);
    b.textLine(`Encoding: ${sampleEncoding}`, cols, enc);
    b.textLine('اختبار الطباعة العربية', cols, enc);
    b.textLine('فاتورة بيع 123.45', cols, enc);
    b.textLine('English OK', cols, enc);
  }

  b.feed(2);
  if (profile.cut_paper) b.cut();
  return b.build();
}

export function buildTestPageEscPos(profile: PrinterProfile): Uint8Array {
  const cols = profile.characters_per_line || charsForPaper(profile.paper_width);
  const enc = effectiveTextEncoding(profile);
  const b = EscPosBuilder.forProfile(profile).init().codePage(enc).align('center').bold(true).size(true, true);
  b.textLine('MADAR POS TEST', cols, enc).size(false, false).bold(false);
  b.separator(cols);
  b.align('left');
  b.textLine(`Profile: ${profile.name}`, cols, enc);
  b.textLine(`Connection: ${profile.connection_type}`, cols, enc);
  b.textLine(`Paper: ${profile.paper_width}`, cols, enc);
  if (profile.ip) b.textLine(`IP: ${profile.ip}:${profile.port}`, cols, enc);
  b.textLine(`Date: ${new Date().toLocaleDateString('en-GB')}`, cols, enc);
  b.textLine(`Time: ${new Date().toLocaleTimeString('en-GB')}`, cols, enc);
  const rand = Math.floor(10000 + Math.random() * 89999);
  b.textLine(`Random: ${rand}`, cols, enc);
  b.separator(cols);
  b.textLine('Arabic Test:', cols, enc);
  b.textLine('اختبار الطباعة العربية', cols, enc);
  b.textLine('English Test:', cols, enc);
  b.textLine('Printer Test Successful', cols, enc);
  b.separator(cols);
  b.feed(4);
  if (profile.cut_paper) b.cut();
  return b.build();
}
