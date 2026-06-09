import React from 'react';
import Barcode from 'react-native-barcode-svg';
import { View } from 'react-native';
import { PrintText as Text } from '@/components/printing/PrintText';
import { receiptPrintLabels } from '@/constants/printLabels';

type Props = {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
};

export function ReceiptInvoiceBarcode({ value, width = 280, height = 40, fontSize = 10 }: Props) {
  const trimmed = value.trim();
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
