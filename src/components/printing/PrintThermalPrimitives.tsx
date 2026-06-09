import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PrintText as Text } from '@/components/printing/PrintText';
import { useReceiptLineHeight } from '@/components/printing/receiptPrintLayout';

type MetaRowProps = {
  label: string;
  value?: string | null;
  valueLtr?: boolean;
  fontSize: number;
};

export function PrintMetaRow({ label, value, valueLtr, fontSize }: MetaRowProps) {
  const lineHeight = useReceiptLineHeight();
  if (!value?.trim()) return null;
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaLabel, { fontSize, lineHeight: fontSize * lineHeight }]}>
        {label}
      </Text>
      <View style={styles.metaLeader} />
      <Text
        style={[styles.metaValue, { fontSize, lineHeight: fontSize * lineHeight }]}
        numeric={valueLtr}
      >
        {value}
      </Text>
    </View>
  );
}

type OrderHeroProps = {
  label: string;
  value: string;
  labelFontSize?: number;
  valueFontSize?: number;
  /** @deprecated Prefer labelFontSize + valueFontSize (kitchen tickets). */
  fontSize?: number;
};

export function PrintOrderHero({ label, value, labelFontSize, valueFontSize, fontSize }: OrderHeroProps) {
  const lineHeight = useReceiptLineHeight();
  const labelFs = labelFontSize ?? (fontSize != null ? fontSize * 0.85 : 10);
  const valueFs = valueFontSize ?? (fontSize != null ? fontSize * 1.5 : 21);
  return (
    <View style={styles.orderHero}>
      <Text
        style={[
          styles.orderHeroLabel,
          { fontSize: labelFs, lineHeight: labelFs * lineHeight },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.orderHeroValue,
          { fontSize: valueFs, lineHeight: valueFs * 1.1 },
        ]}
        numeric
      >
        {value}
      </Text>
    </View>
  );
}

type TotalRowProps = {
  label: string;
  value: string;
  fontSize: number;
  bold?: boolean;
  negative?: boolean;
};

export function PrintTotalRow({ label, value, fontSize, bold, negative }: TotalRowProps) {
  const lineHeight = useReceiptLineHeight();
  return (
    <View style={styles.totalRow}>
      <Text
        style={[
          styles.totalLabel,
          { fontSize, lineHeight: fontSize * lineHeight },
          bold ? styles.bold : null,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.totalValue,
          { fontSize, lineHeight: fontSize * lineHeight },
          bold ? styles.bold : null,
        ]}
        numeric
      >
        {negative ? `-${value}` : value}
      </Text>
    </View>
  );
}

type GrandTotalProps = {
  label: string;
  value: string;
  fontSize: number;
};

export function PrintGrandTotalBox({ label, value, fontSize }: GrandTotalProps) {
  return (
    <View style={styles.grandTotalBox}>
      <PrintTotalRow label={label} value={value} fontSize={fontSize} bold />
    </View>
  );
}

export function PrintSectionDivider() {
  return <View style={styles.divider} />;
}

type SectionTitleProps = {
  title: string;
  fontSize: number;
};

export function PrintSectionTitle({ title, fontSize }: SectionTitleProps) {
  const lineHeight = useReceiptLineHeight();
  return (
    <Text
      style={[
        styles.sectionTitle,
        { fontSize, lineHeight: fontSize * lineHeight },
      ]}
    >
      {title}
    </Text>
  );
}

type LogoProps = {
  uri: string | null;
  maxWidth?: number;
  maxHeight?: number;
  onLoad?: () => void;
  onError?: () => void;
};

export function PrintLogo({ uri, maxWidth = 100, maxHeight = 48, onLoad, onError }: LogoProps) {
  if (!uri) return null;
  return (
    <View style={styles.logoWrap}>
      <Image
        source={{ uri }}
        style={{ width: maxWidth, height: maxHeight }}
        resizeMode="contain"
        onLoad={onLoad}
        onError={onError}
      />
    </View>
  );
}

type DocumentTitleProps = {
  title: string;
  fontSize: number;
};

export function PrintDocumentTitle({ title, fontSize }: DocumentTitleProps) {
  const lineHeight = useReceiptLineHeight();
  return (
    <View style={styles.documentTitle}>
      <Text
        style={[
          styles.documentTitleText,
          { fontSize, lineHeight: fontSize * lineHeight },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

type ReprintBannerProps = {
  text: string;
  fontSize: number;
};

export function PrintReprintBanner({ text, fontSize }: ReprintBannerProps) {
  const lineHeight = useReceiptLineHeight();
  return (
    <View style={styles.reprintBanner}>
      <Text
        style={[
          styles.reprintText,
          { fontSize, lineHeight: fontSize * lineHeight },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  metaLabel: {
    color: '#000',
    fontWeight: '500',
  },
  metaLeader: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
    borderStyle: 'dotted',
    marginHorizontal: 4,
    marginBottom: 2,
  },
  metaValue: {
    color: '#000',
    fontWeight: '500',
    maxWidth: '62%',
    textAlign: 'left',
  },
  orderHero: {
    borderWidth: 1.5,
    borderColor: '#111',
    borderRadius: 4,
    backgroundColor: '#fafafa',
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
    marginBottom: 5,
  },
  orderHeroLabel: {
    color: '#000',
    fontWeight: '500',
    marginBottom: 2,
  },
  orderHeroValue: {
    color: '#000',
    fontWeight: '500',
    letterSpacing: 1.7,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 2,
  },
  totalLabel: {
    color: '#000',
    fontWeight: '500',
    flex: 1,
  },
  totalValue: {
    color: '#000',
    fontWeight: '500',
    textAlign: 'left',
  },
  bold: {
    fontWeight: '500',
  },
  grandTotalBox: {
    borderWidth: 1.5,
    borderColor: '#111',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 5,
    marginTop: 4,
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#111',
    marginVertical: 5,
  },
  sectionTitle: {
    color: '#000',
    fontWeight: '500',
    marginBottom: 3,
    textAlign: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  documentTitle: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 4,
  },
  documentTitleText: {
    color: '#000',
    fontWeight: '500',
  },
  reprintBanner: {
    borderWidth: 1,
    borderColor: '#111',
    borderStyle: 'dashed',
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignItems: 'center',
    marginBottom: 4,
  },
  reprintText: {
    color: '#000',
    fontWeight: '500',
  },
});
