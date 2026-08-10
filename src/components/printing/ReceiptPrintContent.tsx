import { designColors } from '@/constants/colors';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { PrintText as Text } from '@/components/printing/PrintText';
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
import { scaledReceiptTokens } from '@/constants/receiptPrintTokens';
import {
  logoMaxHeight,
  logoMaxWidth,
  receiptColumnWidths,
  thermalPaddingPx,
} from '@/constants/printThermalLayout';
import { ReceiptPrintLayoutProvider, useReceiptLineHeight } from '@/components/printing/receiptPrintLayout';
import { useReceiptCaptureLite } from '@/components/printing/receiptCaptureLite';
import { appContentDirection } from '@/constants/layout';

type Props = {
  payload: ReceiptPrintPayload;
  paperWidth: PaperWidth;
  onAssetsReady?: () => void;
};

export function ReceiptPrintContent({ payload, paperWidth, onAssetsReady }: Props) {
  return (
    <ReceiptPrintLayoutProvider paperWidth={paperWidth}>
      <ReceiptPrintContentInner payload={payload} paperWidth={paperWidth} onAssetsReady={onAssetsReady} />
    </ReceiptPrintLayoutProvider>
  );
}

function ReceiptPrintContentInner({ payload, paperWidth, onAssetsReady }: Props) {
  const captureLite = useReceiptCaptureLite();
  const lineHeight = useReceiptLineHeight();
  const vm = useMemo(() => buildReceiptViewModel(payload), [payload]);
  const t = useMemo(() => scaledReceiptTokens(vm, paperWidth), [vm, paperWidth]);
  const width = dotsForPaper(paperWidth);
  const padding = thermalPaddingPx(paperWidth);
  const cols = receiptColumnWidths(width, padding);

  const needsLogo = Boolean(vm.logoUri);
  const needsBarcode = vm.showBarcode;
  const pendingRef = useRef({ logo: needsLogo, barcode: needsBarcode });
  const notifiedRef = useRef(false);

  const tryNotifyReady = useCallback(() => {
    if (notifiedRef.current) return;
    if (pendingRef.current.logo || pendingRef.current.barcode) return;
    notifiedRef.current = true;
    onAssetsReady?.();
  }, [onAssetsReady]);

  useEffect(() => {
    if (captureLite) return;
    pendingRef.current = { logo: needsLogo, barcode: needsBarcode };
    notifiedRef.current = false;
    if (!needsLogo && !needsBarcode) {
      tryNotifyReady();
    }
  }, [captureLite, needsLogo, needsBarcode, payload, tryNotifyReady]);

  const markLogoReady = useCallback(() => {
    pendingRef.current.logo = false;
    tryNotifyReady();
  }, [tryNotifyReady]);

  const markBarcodeReady = useCallback(() => {
    pendingRef.current.barcode = false;
    tryNotifyReady();
  }, [tryNotifyReady]);

  return (
    <View style={[styles.root, captureLite ? styles.rootLite : null, { width, padding }]}>
      <View style={styles.header}>
        <PrintLogo
          uri={vm.logoUri}
          maxWidth={logoMaxWidth(paperWidth, vm.logoScalePercent)}
          maxHeight={logoMaxHeight(paperWidth, vm.logoScalePercent)}
          onLoad={markLogoReady}
          onError={markLogoReady}
        />
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
              { fontSize: t.storeNote, lineHeight: t.storeNote * lineHeight },
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
            { fontSize: t.offline, lineHeight: t.offline * lineHeight },
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
          <View style={[styles.metaCard, captureLite ? styles.metaCardLite : null]}>
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
        <View style={[styles.notesBox, captureLite ? styles.notesBoxLite : null]}>
          <Text
            style={[
              styles.notes,
              { fontSize: t.notes, lineHeight: t.notes * lineHeight },
            ]}
          >
            <Text style={{ fontWeight: '500' }}>{vm.labels.notes}: </Text>
            {vm.notes}
          </Text>
        </View>
      ) : null}

      {vm.showBarcode ? (
        <ReceiptInvoiceBarcode
          value={vm.invoiceNumber}
          width={width - padding * 2}
          fontSize={t.barcodeCaption}
          onReady={markBarcodeReady}
        />
      ) : null}

      <View style={[styles.footer, captureLite ? styles.footerLite : null]}>
        {vm.footerMessage ? (
          <Text
            style={[
              styles.footerText,
              { fontSize: t.footer, lineHeight: t.footer * lineHeight },
            ]}
          >
            {vm.footerMessage}
          </Text>
        ) : null}
        {vm.returnPolicy ? (
          <Text
            style={[
              styles.footerText,
              { fontSize: t.footer, lineHeight: t.footer * lineHeight },
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
              { fontSize: t.footer, lineHeight: t.footer * lineHeight },
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
              { fontSize: t.footerDev, lineHeight: t.footerDev * lineHeight },
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
    backgroundColor: designColors.white,
    direction: appContentDirection.direction,
  },
  rootLite: {
    backgroundColor: designColors.white,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: designColors.dark,
    paddingBottom: 5,
    marginBottom: 5,
  },
  storeName: {
    color: designColors.black,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.34,
  },
  headerNote: {
    color: designColors.black,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  offline: {
    color: designColors.black,
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '500',
  },
  metaSection: {
    marginBottom: 5,
  },
  metaCard: {
    borderWidth: 1,
    borderColor: designColors.darkBorder,
    borderRadius: 4,
    paddingTop: 4,
    paddingHorizontal: 5,
    paddingBottom: 5,
  },
  metaCardLite: {
    borderRadius: 0,
  },
  totals: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: designColors.dark,
  },
  notesBox: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: designColors.grayLight,
    borderStyle: 'dashed',
    borderRadius: 4,
  },
  notesBoxLite: {
    borderStyle: 'solid',
    borderRadius: 0,
  },
  notes: {
    color: designColors.black,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: designColors.grayLight,
    borderStyle: 'dashed',
  },
  footerLite: {
    borderStyle: 'solid',
  },
  footerText: {
    color: designColors.black,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 2,
  },
  footerDev: {
    color: designColors.black,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
  },
});
