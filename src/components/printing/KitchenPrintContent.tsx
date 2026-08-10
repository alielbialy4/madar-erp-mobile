import { designColors } from '@/constants/colors';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import {
  PrintDocumentTitle,
  PrintOrderHero,
  PrintReprintBanner,
  PrintSectionDivider,
  PrintSectionTitle,
} from '@/components/printing/PrintThermalPrimitives';
import { dotsForPaper } from '@/services/printing/escposRaster';
import { scaleKitchenCssPx, clampPrintFontSize } from '@/services/printing/printTypography';
import type { KitchenTicketPayload, PaperWidth } from '@/types/printing';
import { kitchenPrintLabels } from '@/constants/printLabels';
import { thermalPaddingPx } from '@/constants/printThermalLayout';
import { fonts } from '@/constants/fonts';
import { appContentDirection } from '@/constants/layout';

type Props = {
  payload: KitchenTicketPayload;
  paperWidth: PaperWidth;
  fontSizePx?: number;
};

export function KitchenPrintContent({ payload, paperWidth, fontSizePx }: Props) {
  const width = dotsForPaper(paperWidth);
  const padding = thermalPaddingPx(paperWidth);
  const baseFs = clampPrintFontSize(fontSizePx, 'kitchen');
  const scaled = (base: number) => scaleKitchenCssPx(base, baseFs);
  const fs = scaled(12);
  const fsSm = scaled(10);
  const fsLg = scaled(16);

  const title = payload.ticket_type === 'bar' ? kitchenPrintLabels.bar : kitchenPrintLabels.kitchen;
  const printSeq = payload.print_sequence != null ? String(payload.print_sequence) : '';
  const invoice = payload.invoice_number?.trim() ?? '';

  const metaLine = useMemo(
    () =>
      [payload.table_name ? `${kitchenPrintLabels.table}: ${payload.table_name}` : null, payload.date, payload.cashier_name ? `${kitchenPrintLabels.cashier}: ${payload.cashier_name}` : null]
        .filter(Boolean)
        .join(' | '),
    [payload],
  );

  return (
    <View style={[styles.root, { width, padding }]}>
      {payload.store_name ? (
        <Text style={[styles.store, { fontSize: fsLg, fontFamily: fonts.bold }]}>{payload.store_name}</Text>
      ) : null}
      {payload.is_reprint ? <PrintReprintBanner text={kitchenPrintLabels.reprint} fontSize={fsSm} /> : null}
      <PrintDocumentTitle title={title} fontSize={fsLg} />
      {printSeq ? <PrintOrderHero label={kitchenPrintLabels.orderNumber} value={printSeq} fontSize={fsLg} /> : null}
      {invoice ? (
        <View style={styles.invoiceBlock}>
          <Text style={[styles.invoiceLabel, { fontSize: fsSm }]}>{kitchenPrintLabels.invoiceNumber}</Text>
          <Text style={[styles.invoiceValue, { fontSize: fsLg }]} numeric>
            {invoice}
          </Text>
        </View>
      ) : null}
      {metaLine ? <Text style={[styles.meta, { fontSize: fsSm }]}>{metaLine}</Text> : null}
      {payload.order_type ? (
        <Text style={[styles.meta, { fontSize: fsSm }]}>
          {kitchenPrintLabels.orderType}: {payload.order_type}
        </Text>
      ) : null}
      {payload.route_label ? (
        <Text style={[styles.meta, { fontSize: fsSm }]}>
          {kitchenPrintLabels.route}: {payload.route_label}
        </Text>
      ) : null}
      {payload.kitchen_notes ? (
        <Text style={[styles.notes, { fontSize: fsSm }]}>
          {kitchenPrintLabels.kitchenNotes}: {payload.kitchen_notes}
        </Text>
      ) : null}
      <PrintSectionDivider />
      <PrintSectionTitle title={kitchenPrintLabels.item} fontSize={fsSm} />
      {payload.items.map((item, idx) => (
        <View key={`${item.name}-${idx}`} style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemName, { fontSize: fs, fontFamily: fonts.bold }]}>{item.name}</Text>
            {item.category_name ? (
              <Text style={[styles.itemExtra, { fontSize: fsSm }]}>{item.category_name}</Text>
            ) : null}
            {item.modifiers?.map((mod) => (
              <Text key={mod} style={[styles.itemExtra, { fontSize: fsSm }]}>
                + {mod}
              </Text>
            ))}
            {item.options?.flatMap((group) =>
              group.options.map((opt) => (
                <Text key={`${group.group_title}-${opt.name}`} style={[styles.itemExtra, { fontSize: fsSm }]}>
                  {group.group_title ? `${group.group_title}: ` : ''}
                  {opt.name}
                </Text>
              )),
            )}
            {item.notes ? (
              <Text style={[styles.itemExtra, { fontSize: fsSm }]}>{item.notes}</Text>
            ) : null}
          </View>
          <Text style={[styles.qty, { fontSize: fsLg, fontFamily: fonts.bold }]} numeric>
            {item.quantity}
          </Text>
        </View>
      ))}
      {payload.system_ref ? (
        <Text style={[styles.ref, { fontSize: fsSm * 0.9 }]}>
          {kitchenPrintLabels.systemRef}: {payload.system_ref}
        </Text>
      ) : null}
      <Text style={[styles.dev, { fontSize: fsSm * 0.85 }]}>{kitchenPrintLabels.developerFooter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: designColors.white, direction: appContentDirection.direction },
  store: { textAlign: 'center', color: designColors.black, marginBottom: 4 },
  invoiceBlock: { alignItems: 'center', marginVertical: 4 },
  invoiceLabel: { color: designColors.black, fontWeight: '700' },
  invoiceValue: { color: designColors.black, fontWeight: '900' },
  meta: { color: designColors.black, textAlign: 'center', marginBottom: 2 },
  notes: { color: designColors.black, marginVertical: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  itemName: { color: designColors.black, fontWeight: '900' },
  itemExtra: { color: designColors.black },
  qty: { color: designColors.black, minWidth: 28, textAlign: 'center' },
  ref: { color: designColors.darkMuted, marginTop: 8, textAlign: 'center' },
  dev: { color: designColors.darkMuted, marginTop: 6, textAlign: 'center' },
});
