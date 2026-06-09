import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PrintText as Text } from '@/components/printing/PrintText';
import type { ReceiptPrintLabels } from '@/constants/printLabels';
import { useReceiptLineHeight } from '@/components/printing/receiptPrintLayout';
import type { ReceiptPrintItem } from '@/types/printing';

type Props = {
  items: ReceiptPrintItem[];
  cols: number[];
  labels: ReceiptPrintLabels;
  showProductCategory: boolean;
  formatCurrency: (amount: number) => string;
  fontSize: {
    sectionTitle: number;
    tableHeader: number;
    itemName: number;
    lineDesc: number;
    lineExtra: number;
    moneyCell: number;
  };
};

function Cell({
  width,
  children,
  fontSize,
  align = 'right',
  numeric,
}: {
  width: number;
  children: React.ReactNode;
  fontSize: number;
  align?: 'right' | 'center' | 'left';
  numeric?: boolean;
}) {
  const lineHeight = useReceiptLineHeight();
  return (
    <View style={[styles.cell, { width }]}>
      <Text
        style={[
          styles.cellText,
          { fontSize, lineHeight: fontSize * lineHeight, textAlign: align },
        ]}
        numeric={numeric}
      >
        {children}
      </Text>
    </View>
  );
}

export function ReceiptItemsTable({
  items,
  cols,
  labels,
  showProductCategory,
  formatCurrency,
  fontSize,
}: Props) {
  const lineHeight = useReceiptLineHeight();
  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          { fontSize: fontSize.sectionTitle, lineHeight: fontSize.sectionTitle * lineHeight },
        ]}
      >
        {labels.itemsSection}
      </Text>
      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          <Cell width={cols[0]} fontSize={fontSize.tableHeader} align="right">
            {labels.item}
          </Cell>
          <Cell width={cols[1]} fontSize={fontSize.tableHeader} align="center" numeric>
            {labels.qty}
          </Cell>
          <Cell width={cols[2]} fontSize={fontSize.tableHeader} align="center" numeric>
            {labels.price}
          </Cell>
          <Cell width={cols[3]} fontSize={fontSize.tableHeader} align="center" numeric>
            {labels.total}
          </Cell>
        </View>
        {items.map((item, idx) => (
          <View key={`${item.name}-${idx}`} style={styles.row}>
            <View style={[styles.cell, { width: cols[0] }]}>
              <Text
                style={[
                  styles.itemName,
                  { fontSize: fontSize.itemName, lineHeight: fontSize.itemName * lineHeight },
                ]}
              >
                {item.name}
              </Text>
              {showProductCategory && item.category_name ? (
                <Text
                  style={[
                    styles.lineDesc,
                    { fontSize: fontSize.lineDesc, lineHeight: fontSize.lineDesc * lineHeight },
                  ]}
                >
                  {item.category_name}
                </Text>
              ) : null}
              {item.description ? (
                <Text
                  style={[
                    styles.lineDesc,
                    { fontSize: fontSize.lineDesc, lineHeight: fontSize.lineDesc * lineHeight },
                  ]}
                >
                  {item.description}
                </Text>
              ) : null}
              {item.options?.map((group, gi) =>
                group.options.map((opt, oi) => (
                  <Text
                    key={`${gi}-${oi}`}
                    style={[
                      styles.lineExtra,
                      { fontSize: fontSize.lineExtra, lineHeight: fontSize.lineExtra * lineHeight },
                    ]}
                  >
                    {group.group_title ? `${group.group_title}: ` : ''}
                    {opt.name}
                    {opt.applied_price && opt.applied_price > 0
                      ? ` (+${formatCurrency(opt.applied_price)})`
                      : ''}
                  </Text>
                )),
              )}
              {(item.discount ?? 0) > 0 ? (
                <Text
                  style={[
                    styles.lineExtra,
                    { fontSize: fontSize.lineExtra, lineHeight: fontSize.lineExtra * lineHeight },
                  ]}
                >
                  {labels.discount}: -{formatCurrency(item.discount ?? 0)}
                </Text>
              ) : null}
            </View>
            <Cell width={cols[1]} fontSize={fontSize.moneyCell} align="center">
              {item.quantity}
            </Cell>
            <Cell width={cols[2]} fontSize={fontSize.moneyCell} align="center" numeric>
              {formatCurrency(item.unit_price)}
            </Cell>
            <Cell width={cols[3]} fontSize={fontSize.moneyCell} align="center" numeric>
              {formatCurrency(item.line_total ?? 0)}
            </Cell>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 2,
    paddingTop: 4,
    borderTopWidth: 2,
    borderTopColor: '#111',
  },
  sectionTitle: {
    color: '#000',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 3,
  },
  table: {
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerRow: {
    backgroundColor: '#f3f4f6',
  },
  cell: {
    borderRightWidth: 1,
    borderRightColor: '#222',
    paddingVertical: 2,
    paddingHorizontal: 1,
    minHeight: 0,
  },
  cellText: {
    color: '#000',
    fontWeight: '500',
  },
  itemName: {
    color: '#000',
    fontWeight: '400',
    textAlign: 'right',
  },
  lineDesc: {
    color: '#000',
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 1,
  },
  lineExtra: {
    color: '#000',
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 1,
  },
});
