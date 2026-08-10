import { designColors } from '@/constants/colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { PrintSectionDivider, PrintSectionTitle, PrintTotalRow } from '@/components/printing/PrintThermalPrimitives';
import { dotsForPaper } from '@/services/printing/escposRaster';
import { clampPrintFontSize, scaleShiftCssPx } from '@/services/printing/printTypography';
import type { PaperWidth, ShiftCloseReportPayload } from '@/types/printing';
import { shiftClosePrintLabels } from '@/constants/printLabels';
import { thermalPaddingPx } from '@/constants/printThermalLayout';
import { fonts } from '@/constants/fonts';
import { appContentDirection, appTextAlignStart, appTextAlignEnd } from '@/constants/layout';

type Props = {
  payload: ShiftCloseReportPayload;
  paperWidth: PaperWidth;
  fontSizePx?: number;
};

export function ShiftClosePrintContent({ payload, paperWidth, fontSizePx }: Props) {
  const width = dotsForPaper(paperWidth);
  const padding = thermalPaddingPx(paperWidth);
  const baseFs = clampPrintFontSize(fontSizePx, 'shift');
  const scaled = (base: number) => scaleShiftCssPx(base, baseFs);
  const fs = scaled(10);
  const fsTitle = scaled(12);

  return (
    <View style={[styles.root, { width, padding }]}>
      <Text style={[styles.title, { fontSize: fsTitle, fontFamily: fonts.bold }]}>
        {shiftClosePrintLabels.title}
      </Text>
      {payload.branch_name ? (
        <Text style={[styles.subtitle, { fontSize: fs }]}>{payload.branch_name}</Text>
      ) : null}
      <Text style={[styles.subtitle, { fontSize: fs }]}>{payload.shift_label}</Text>
      {payload.opened_at ? (
        <Text style={[styles.meta, { fontSize: fs }]}>
          {shiftClosePrintLabels.opened}: {payload.opened_at}
        </Text>
      ) : null}
      {payload.closed_at ? (
        <Text style={[styles.meta, { fontSize: fs }]}>
          {shiftClosePrintLabels.closed}: {payload.closed_at}
        </Text>
      ) : null}
      {payload.cashier_name ? (
        <Text style={[styles.meta, { fontSize: fs }]}>
          {shiftClosePrintLabels.cashier}: {payload.cashier_name}
        </Text>
      ) : null}
      {payload.vault_name ? (
        <Text style={[styles.meta, { fontSize: fs }]}>
          {shiftClosePrintLabels.vault}: {payload.vault_name}
        </Text>
      ) : null}
      <PrintSectionDivider />
      {payload.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <PrintSectionTitle title={section.title} fontSize={fsTitle} />
          {section.rows.map((row) => (
            <PrintTotalRow
              key={`${section.title}-${row.label}`}
              label={row.label}
              value={row.value}
              fontSize={fs}
              bold={row.bold}
            />
          ))}
          {section.lineItems?.map((line, idx) => (
            <View key={`${section.title}-line-${idx}`} style={styles.lineItem}>
              <Text style={[styles.linePrimary, { fontSize: fs }]}>{line.primary}</Text>
              {line.secondary ? (
                <Text style={[styles.lineSecondary, { fontSize: fs * 0.9 }]}>{line.secondary}</Text>
              ) : null}
              {line.amount ? (
                <Text style={[styles.lineAmount, { fontSize: fs }]} numeric>
                  {line.amount}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ))}
      {payload.developer_footer ? (
        <Text style={[styles.dev, { fontSize: fs * 0.85 }]}>{payload.developer_footer}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: designColors.white, direction: appContentDirection.direction },
  title: { textAlign: 'center', color: designColors.black, fontWeight: '900', marginBottom: 4 },
  subtitle: { textAlign: 'center', color: designColors.black, fontWeight: '700' },
  meta: { color: designColors.black, textAlign: appTextAlignStart, marginBottom: 2 },
  section: { marginBottom: 6 },
  lineItem: { marginBottom: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: designColors.grayBorder, paddingBottom: 2 },
  linePrimary: { color: designColors.black, fontWeight: '700' },
  lineSecondary: { color: designColors.darkSoft },
  lineAmount: { color: designColors.black, textAlign: appTextAlignEnd, fontWeight: '900' },
  dev: { color: designColors.darkMuted, textAlign: 'center', marginTop: 8 },
});
