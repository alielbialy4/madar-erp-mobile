import React, { useEffect } from 'react';
import Barcode from 'react-native-barcode-svg';
import { View } from 'react-native';
import { PrintText as Text } from '@/components/printing/PrintText';
import { useReceiptCaptureLite } from '@/components/printing/receiptCaptureLite';
import { receiptPrintLabels } from '@/constants/printLabels';

type Props = {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  onReady?: () => void;
};

export function ReceiptInvoiceBarcode({ value, width = 280, height = 40, fontSize = 10, onReady }: Props) {
  const captureLite = useReceiptCaptureLite();
  const trimmed = value.trim();
  useEffect(() => {
    if (!trimmed || !onReady) return;
    if (captureLite) {
      onReady();
      return;
    }
    let frame = 0;
    const step = () => {
      frame += 1;
      if (frame >= 2) onReady();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [captureLite, trimmed, onReady]);

  if (!trimmed) return null;
  return (
    <View style={{ alignItems: 'center', marginVertical: 4 }}>
      <Barcode value={trimmed} format="CODE128" singleBarWidth={1.1} height={height} />
      <View style={{ flexDirection: 'row', marginTop: 2, gap: 4 }}>
        <Text style={{ fontSize, color: '#000', fontWeight: '400' }}>
          {receiptPrintLabels.invoiceNumber}:
        </Text>
        <Text style={{ fontSize, color: '#000', fontWeight: '500' }} numeric>
          {trimmed}
        </Text>
      </View>
    </View>
  );
}
