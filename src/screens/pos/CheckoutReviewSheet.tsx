import React from 'react';
import { StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppSectionHeader } from '@/components/ui';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { money } from '@/utils/format';
import type { CartLine } from '@/store/posStore';
import type { Coupon } from '@/types/api';

type Props = {
  visible: boolean;
  cart: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  coupon: { coupon: Coupon; discount: number } | null;
  paymentType: string;
  paid: number;
  customerName: string | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function CheckoutReviewSheet({ visible, cart, subtotal, discount, total, coupon, paymentType, paid, customerName, onClose, onConfirm, loading }: Props) {
  const paymentLabels: Record<string, string> = { cash: 'نقدي', card: 'بطاقة', credit: 'آجل', wallet: 'محفظة', split: 'مقسم' };
  const couponDiscount = coupon?.discount ?? 0;
  const grandTotal = total - couponDiscount;

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <AppSectionHeader title="مراجعة الطلب" />
        {customerName ? <Text style={styles.customerText}>العميل: {customerName}</Text> : null}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأصناف</Text>
          {cart.map((line, i) => (
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineTotal}>{money(line.quantity * line.unit_price)}</Text>
              <View style={styles.lineInfo}>
                <Text style={styles.lineName}>{line.product_name}</Text>
                <Text style={styles.lineMeta}>{money(line.unit_price)} × {line.quantity}</Text>
                {line.selected_options?.map((opt, j) => (
                  <Text key={j} style={styles.optionText}>
                    {opt.group_title}: {opt.options.map((o) => o.name).join(', ')}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>المجموع الفرعي</Text><Text style={styles.summaryValue}>{money(subtotal)}</Text></View>
          {discount > 0 ? <View style={styles.summaryRow}><Text style={styles.summaryLabel}>الخصم</Text><Text style={[styles.summaryValue, { color: colors.danger }]}>-{money(discount)}</Text></View> : null}
          {couponDiscount > 0 ? <View style={styles.summaryRow}><Text style={styles.summaryLabel}>كوبون ({coupon!.coupon.code})</Text><Text style={[styles.summaryValue, { color: colors.danger }]}>-{money(couponDiscount)}</Text></View> : null}
          <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.totalLabel}>الإجمالي</Text><Text style={styles.totalValue}>{money(grandTotal)}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>طريقة الدفع</Text><Text style={styles.summaryValue}>{paymentLabels[paymentType] ?? paymentType}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>المدفوع</Text><Text style={styles.summaryValue}>{money(paid)}</Text></View>
          {paid > grandTotal ? <View style={styles.summaryRow}><Text style={styles.summaryLabel}>الباقي</Text><Text style={styles.summaryValue}>{money(paid - grandTotal)}</Text></View> : null}
        </View>
        <AppButton title="تأكيد البيع" onPress={onConfirm} loading={loading} fullWidth size="lg" />
        <AppButton title="رجوع" variant="outline" onPress={onClose} fullWidth />
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  customerText: { color: colors.text, fontSize: typography.body, fontWeight: '800', ...textStart },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.textMuted, fontSize: typography.small, fontWeight: '800', ...textStart },
  lineRow: { ...flexRow, justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.borderSubtle, paddingVertical: spacing.xs },
  lineInfo: { flex: 1, gap: 2 },
  lineName: { color: colors.text, fontWeight: '700', ...textStart, fontSize: typography.small },
  lineMeta: { color: colors.textMuted, ...textStart, fontSize: typography.tiny },
  optionText: { color: colors.textMuted, ...textStart, fontSize: typography.tiny },
  lineTotal: { color: colors.text, fontWeight: '800', fontSize: typography.small, minWidth: 70, writingDirection: 'ltr', textAlign: 'left' },
  summaryBox: { backgroundColor: colors.surfaceMuted, borderRadius: radius.xl, padding: spacing.md, gap: spacing.xs },
  summaryRow: { ...flexRow, justifyContent: 'space-between' },
  summaryLabel: { color: colors.textMuted, fontSize: typography.small },
  summaryValue: { color: colors.text, fontSize: typography.small, fontWeight: '700' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: spacing.sm, marginTop: spacing.xs },
  totalLabel: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  totalValue: { color: colors.text, fontSize: typography.h3, fontWeight: '800' },
});
