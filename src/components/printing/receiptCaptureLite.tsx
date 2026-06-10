import React, { createContext, useContext } from 'react';

/** True while PrintCaptureHost renders — flat borders, no asset capture gates. */
const ReceiptCaptureLiteContext = createContext(false);

export function ReceiptCaptureLiteProvider({ children }: { children: React.ReactNode }) {
  return <ReceiptCaptureLiteContext.Provider value={true}>{children}</ReceiptCaptureLiteContext.Provider>;
}

export function useReceiptCaptureLite(): boolean {
  return useContext(ReceiptCaptureLiteContext);
}
