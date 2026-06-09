import type { ReceiptViewModel } from '@/services/printing/buildReceiptViewModel';

/** Base px sizes mirrored from front/src/Components/PrintReceipt/receiptSharedCss.ts */
export const RECEIPT_PRINT_TOKENS = {
  storeName: 17,
  storeNote: 11,
  documentTitle: 11,
  orderHeroLabel: 10,
  orderHeroValue: 21,
  metaRow: 11.5,
  sectionTitle: 12,
  tableHeader: 11,
  tableBody: 12,
  itemName: 12,
  lineDesc: 10,
  lineExtra: 9.5,
  moneyCell: 11,
  totals: 12,
  splitRow: 11,
  grandTotal: 14,
  notes: 10.5,
  barcodeCaption: 10.5,
  footer: 10.5,
  footerDev: 9.5,
  reprint: 10.5,
  offline: 10.5,
} as const;

export type ReceiptPrintTokenKey = keyof typeof RECEIPT_PRINT_TOKENS;

export const RECEIPT_PRINT_LINE_HEIGHT = 1.35;

export function scaledReceiptToken(vm: ReceiptViewModel, key: ReceiptPrintTokenKey): number {
  return vm.scaled(RECEIPT_PRINT_TOKENS[key]);
}

export function scaledReceiptTokens(vm: ReceiptViewModel): Record<ReceiptPrintTokenKey, number> {
  const out = {} as Record<ReceiptPrintTokenKey, number>;
  for (const key of Object.keys(RECEIPT_PRINT_TOKENS) as ReceiptPrintTokenKey[]) {
    out[key] = scaledReceiptToken(vm, key);
  }
  return out;
}
