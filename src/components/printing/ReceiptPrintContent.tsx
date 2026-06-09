import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import {
  PrintDocumentTitle,
  PrintGrandTotalBox,
  PrintLogo,
  PrintMetaRow,
  PrintOrderHero,
  PrintReprintBanner,
  PrintTotalRow,
} from '@/components/printing/PrintThermalPrimitives';
import { ReceiptItemsTable } from '@/components/printing/ReceiptItemsTable';
import { ReceiptInvoiceBarcode } from '@/components/printing/ReceiptInvoiceBarcode';
import { buildReceiptViewModel } from '@/services/printing/buildReceiptViewModel';
import { dotsForPaper } from '@/services/printing/escposRaster';
import type { PaperWidth, ReceiptPrintPayload } from '@/types/printing';
import {
  RECEIPT_PRINT_LINE_HEIGHT,
  scaledReceiptTokens,
} from '@/constants/receiptPrintTokens';
import { receiptColumnWidths, thermalPaddingPx } from '@/constants/printThermalLayout';
import { fonts } from '@/constants/fonts';

type Props = {
  payload: ReceiptPrintPayload;
  paperWidth: PaperWidth;
};

export function ReceiptPrintContent({ payload, paperWidth }: Props) {
  const vm = useMemo(() => buildReceiptViewModel(payload), [payload]);
  const t = useMemo(() => scaledReceiptTokens(vm), [vm]);
  const width = dotsForPaper(paperWidth);
  const padding = thermalPaddingPx(paperWidth);
  const cols = receiptColumnWidths(width, padding);

  return (
    <View style={[styles.root, { width, padding }]}>
      <View style={styles.header}>
        <PrintLogo uri={vm.logoUri} />
        {vm.showBranchName && vm.storeName ? (
          <Text
            style={[
              styles.storeName,
              { fontSize: t.storeName, lineHeight: t.storeName * 1.2 },
            ]}
          >
            {vm.storeName}
          </Text>
        ) : null}
        {vm.headerNote ? (
          <Text
            style={[
              styles.headerNote,
              { fontSize: t.storeNote, lineHeight: t.storeNote * RECEIPT_PRINT_LINE_HEIGHT },
            ]}
          >
            {vm.headerNote}
          </Text>
        ) : null}
        {vm.documentTitle ? (
          <PrintDocumentTitle title={vm.documentTitle} fontSize={t.documentTitle} />
        ) : null}
      </View>

      {vm.isReprint ? <PrintReprintBanner text={vm.labels.reprint} fontSize={t.reprint} /> : null}
      {vm.isOffline ? (
        <Text
          style={[
            styles.offline,
            { fontSize: t.offline, lineHeight: t.offline * RECEIPT_PRINT_LINE_HEIGHT, fontFamily: fonts.bold },
          ]}
        >
          {vm.labels.offlineUnsynced}
        </Text>
      ) : null}

      {(vm.showOrderHero ||
        vm.date ||
        vm.showInvoiceInMeta ||
        vm.customerName ||
        vm.cashierName ||
        vm.paymentSummary ||
        vm.orderContext) ? (
        <View style={styles.metaSection}>
          {vm.showOrderHero ? (
            <PrintOrderHero
              label={vm.labels.orderNumber}
              value={vm.printSequence}
              labelFontSize={t.orderHeroLabel}
              valueFontSize={t.orderHeroValue}
            />
          ) : null}
          <View style={styles.metaCard}>
            <PrintMetaRow label={vm.labels.date} value={vm.date} fontSize={t.metaRow} />
            {vm.showInvoiceInMeta ? (
              <PrintMetaRow
                label={vm.labels.invoiceNumber}
                value={vm.invoiceNumber}
                valueLtr
                fontSize={t.metaRow}
              />
            ) : null}
            <PrintMetaRow label={vm.labels.customer} value={vm.customerName} fontSize={t.metaRow} />
            <PrintMetaRow label={vm.labels.cashier} value={vm.cashierName} fontSize={t.metaRow} />
            <PrintMetaRow label={vm.labels.paymentType} value={vm.paymentSummary} fontSize={t.metaRow} />
            <PrintMetaRow label={vm.labels.order} value={vm.orderContext} fontSize={t.metaRow} />
          </View>
        </View>
      ) : null}

      <ReceiptItemsTable
        items={vm.items}
        cols={cols}
        labels={vm.labels}
        showProductCategory={vm.showProductCategory}
        formatCurrency={vm.formatCurrency}
        fontSize={{
          sectionTitle: t.sectionTitle,
          tableHeader: t.tableHeader,
          itemName: t.itemName,
          lineDesc: t.lineDesc,
          lineExtra: t.lineExtra,
          moneyCell: t.moneyCell,
        }}
      />

      <View style={styles.totals}>
        {vm.showSubtotal && vm.subtotal > 0 ? (
          <PrintTotalRow
            label={vm.labels.subtotal}
            value={vm.formatCurrency(vm.subtotal)}
            fontSize={t.totals}
          />
        ) : null}
        {vm.discount > 0 ? (
          <PrintTotalRow
            label={vm.labels.discount}
            value={vm.formatCurrency(vm.discount)}
            fontSize={t.totals}
            negative
          />
        ) : null}
        {vm.couponDiscount > 0 ? (
          <PrintTotalRow
            label={
              vm.couponCode
                ? vm.labels.couponWithCode(vm.couponCode)
                : vm.labels.couponIncluded
            }
            value={vm.formatCurrency(vm.couponDiscount)}
            fontSize={t.splitRow}
          />
        ) : null}
        {vm.tax > 0 ? (
          <PrintTotalRow label={vm.labels.tax} value={vm.formatCurrency(vm.tax)} fontSize={t.totals} />
        ) : null}
        {vm.deliveryFee > 0 ? (
          <PrintTotalRow
            label={vm.labels.deliveryFee}
            value={vm.formatCurrency(vm.deliveryFee)}
            fontSize={t.totals}
          />
        ) : null}
        <PrintGrandTotalBox
          label={vm.labels.total}
          value={vm.formatCurrency(vm.total)}
          fontSize={t.grandTotal}
        />
        {vm.paymentBreakdown.length > 1
          ? vm.paymentBreakdown.map((line) => (
              <PrintTotalRow
                key={line.label}
                label={line.label}
                value={vm.formatCurrency(line.amount)}
                fontSize={t.splitRow}
              />
            ))
          : null}
        {vm.showPaid ? (
          <PrintTotalRow label={vm.labels.paid} value={vm.formatCurrency(vm.paid)} fontSize={t.totals} />
        ) : null}
        {vm.change > 0 ? (
          <PrintTotalRow
            label={vm.labels.change}
            value={vm.formatCurrency(vm.change)}
            fontSize={t.totals}
          />
        ) : null}
        {vm.balance > 0 ? (
          <PrintTotalRow
            label={vm.labels.balance}
            value={vm.formatCurrency(vm.balance)}
            fontSize={t.totals}
          />
        ) : null}
      </View>

      {vm.notes ? (
        <View style={styles.notesBox}>
          <Text
            style={[
              styles.notes,
              { fontSize: t.notes, lineHeight: t.notes * RECEIPT_PRINT_LINE_HEIGHT },
            ]}
          >
            <Text style={{ fontFamily: fonts.bold, fontWeight: '900' }}>{vm.labels.notes}: </Text>
            {vm.notes}
          </Text>
        </View>
      ) : null}

      {vm.showBarcode ? (
        <ReceiptInvoiceBarcode
          value={vm.invoiceNumber}
          width={width - padding * 2}
          fontSize={t.barcodeCaption}
        />
      ) : null}

      <View style={styles.footer}>
        {vm.footerMessage ? (
          <Text
            style={[
              styles.footerText,
              { fontSize: t.footer, lineHeight: t.footer * RECEIPT_PRINT_LINE_HEIGHT },
            ]}
          >
            {vm.footerMessage}
          </Text>
        ) : null}
        {vm.returnPolicy ? (
          <Text
            style={[
              styles.footerText,
              { fontSize: t.footer, lineHeight: t.footer * RECEIPT_PRINT_LINE_HEIGHT },
            ]}
          >
            {vm.returnPolicy}
          </Text>
        ) : null}
        {[vm.address, vm.phone ? `${vm.labels.phonePrefix} ${vm.phone}` : '', vm.email]
          .filter(Boolean)
          .length > 0 ? (
          <Text
            style={[
              styles.footerText,
              { fontSize: t.footer, lineHeight: t.footer * RECEIPT_PRINT_LINE_HEIGHT },
            ]}
          >
            {[vm.address, vm.phone ? `${vm.labels.phonePrefix} ${vm.phone}` : '', vm.email]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        ) : null}
        {vm.developerFooter ? (
          <Text
            style={[
              styles.footerDev,
              { fontSize: t.footerDev, lineHeight: t.footerDev * RECEIPT_PRINT_LINE_HEIGHT },
            ]}
          >
            {vm.developerFooter}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#ffffff',
    direction: 'rtl',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#111',
    paddingBottom: 5,
    marginBottom: 5,
  },
  storeName: {
    color: '#000',
    fontFamily: fonts.bold,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.34,
  },
  headerNote: {
    color: '#000',
    fontFamily: fonts.bold,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 2,
  },
  offline: {
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '900',
  },
  metaSection: {
    marginBottom: 5,
  },
  metaCard: {
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 4,
    paddingTop: 4,
    paddingHorizontal: 5,
    paddingBottom: 5,
  },
  totals: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#111',
  },
  notesBox: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#999',
    borderStyle: 'dashed',
    borderRadius: 4,
  },
  notes: {
    color: '#000',
    fontFamily: fonts.bold,
    fontWeight: '900',
  },
  footer: {
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#999',
    borderStyle: 'dashed',
  },
  footerText: {
    color: '#000',
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontWeight: '900',
    marginBottom: 2,
  },
  footerDev: {
    color: '#000',
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontWeight: '900',
    marginTop: 4,
  },
});
