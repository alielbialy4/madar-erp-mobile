import React, { createContext, useContext } from 'react';
import type { PaperWidth } from '@/types/printing';
import { receiptPrintLineHeight } from '@/constants/receiptPrintTokens';

const LineHeightContext = createContext(receiptPrintLineHeight('80mm'));

export function ReceiptPrintLayoutProvider({
  paperWidth,
  children,
}: {
  paperWidth: PaperWidth;
  children: React.ReactNode;
}) {
  return (
    <LineHeightContext.Provider value={receiptPrintLineHeight(paperWidth)}>
      {children}
    </LineHeightContext.Provider>
  );
}

export function useReceiptLineHeight(): number {
  return useContext(LineHeightContext);
}
