import React from 'react';
import { View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBottomSheet } from '@/components/layout';
import { AppButton } from '@/components/ui';
import {
  PosSheetHeader,
  PosSheetSection,
  PosTotalHero,
  usePosSheetStyles,
} from '@/components/pos/posSheetUi';
import { useColors } from '@/hooks/useColors';
import { money } from '@/utils/format';
import type { CartLine } from '@/store/posStore';
import type { Coupon } from '@/types/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow } from '@/constants/layout';

type Props = {
  visible: boolean;
  cart: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  coupon: { coupon: Coupon; discount: number } | null;
  promotionDiscount?: number;
  tax?: number;
  serviceCharge?: number;
  deliveryFee?: number;
  loyaltyDiscount?: number;
  loyaltyPointsRedeemed?: number;
  giftCard?: { code: string; amount: number; balance: number } | null;
  paymentType: string;
  paid: number;
  customerName: string | null;
  tableName?: string | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

const PAYMENT_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  cash: 'payments',
  card: 'credit-card',
  credit: 'schedule',
  wallet: 'account-balance-wallet',
  split: 'call-split',
  gift_card: 'card-giftcard',
  layaway: 'shopping-cart',
};

export function CheckoutReviewSheet({
  visible,
  cart,
  subtotal,
  discount,
  total,
  coupon,
  promotionDiscount = 0,
  tax = 0,
  serviceCharge = 0,
  deliveryFee = 0,
  loyaltyDiscount = 0,
  loyaltyPointsRedeemed = 0,
  giftCard,
  paymentType,
  paid,
  customerName,
  tableName,
  onClose,
  onConfirm,
  loading,
}: Props) {
  const c = useColors();
  const s = usePosSheetStyles();
  const paymentLabels: Record<string, string> = {
    cash: 'نقدي',
    card: 'بطاقة',
    credit: 'آجل',
    wallet: 'محفظة',
    split: 'مقسم',
    gift_card: 'بطاقة هدايا',
    layaway: 'تقسيط',
  };
  const couponDiscount = coupon?.discount ?? 0;
  const grandTotal = Math.max(0, total - loyaltyDiscount);
  const giftAmount = paymentType === 'gift_card' && giftCard ? giftCard.amount : 0;
  const cashDue = Math.max(0, grandTotal - giftAmount);
  const effectivePaid = paymentType === 'gift_card' ? paid + giftAmount : paid;
  const change = effectivePaid > grandTotal ? effectivePaid - grandTotal : 0;

  const paymentIcon = PAYMENT_ICONS[paymentType] ?? 'payment';

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <View style={s.root}>
        <PosSheetHeader
          title="مراجعة الطلب"
          subtitle={[customerName ? `العميل: ${customerName}` : 'بيع بدون عميل', tableName ? `الطاولة: ${tableName}` : null]
            .filter(Boolean)
            .join(' • ')}
        />
        <PosTotalHero label="الإجمالي النهائي" amount={money(grandTotal)} hint={`${cart.length} أصناف في السلة`} />

        <View style={s.section}>
          <Text style={s.sectionLabel}>الأصناف</Text>
          {cart.map((line, i) => (
            <View key={i} style={s.lineCard}>
              <View style={s.lineRow}>
                <Text style={s.lineAmount}>{money(line.quantity * line.unit_price)}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.lineName}>{line.product_name}</Text>
                  <Text style={s.lineMeta}>
                    {money(line.unit_price)} × {line.quantity}
                  </Text>
                  {line.selected_options?.map((opt, j) => (
                    <Text key={j} style={s.lineMeta}>
                      {opt.group_title}: {opt.options.map((o) => o.name).join('، ')}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        <PosSheetSection label="ملخص المبالغ">
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>المجموع الفرعي</Text>
            <Text style={s.summaryValue}>{money(subtotal)}</Text>
          </View>
          {promotionDiscount > 0 ? (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>عروض</Text>
              <Text style={[s.summaryValue, s.summaryDiscount]}>-{money(promotionDiscount)}</Text>
            </View>
          ) : null}
          {discount > 0 ? (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>خصم</Text>
              <Text style={[s.summaryValue, s.summaryDiscount]}>-{money(discount)}</Text>
            </View>
          ) : null}
          {couponDiscount > 0 && discount <= 0 ? (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>كوبون ({coupon!.coupon.code})</Text>
              <Text style={[s.summaryValue, s.summaryDiscount]}>-{money(couponDiscount)}</Text>
            </View>
          ) : null}
          {tax > 0 ? (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>الضريبة</Text>
              <Text style={s.summaryValue}>{money(tax)}</Text>
            </View>
          ) : null}
          {serviceCharge > 0 ? (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>رسوم الخدمة</Text>
              <Text style={s.summaryValue}>{money(serviceCharge)}</Text>
            </View>
          ) : null}
          {deliveryFee > 0 ? (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>رسوم التوصيل</Text>
              <Text style={s.summaryValue}>{money(deliveryFee)}</Text>
            </View>
          ) : null}
          {loyaltyDiscount > 0 ? (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>نقاط ولاء ({loyaltyPointsRedeemed})</Text>
              <Text style={[s.summaryValue, s.summaryDiscount]}>-{money(loyaltyDiscount)}</Text>
            </View>
          ) : null}
          {giftAmount > 0 ? (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>بطاقة هدايا ({giftCard!.code})</Text>
              <Text style={[s.summaryValue, s.summaryDiscount]}>-{money(giftAmount)}</Text>
            </View>
          ) : null}
          <View style={s.divider} />
          <View style={s.summaryRow}>
            <Text style={[s.summaryLabel, { color: c.text, fontFamily: 'Tajawal_700Bold' }]}>الإجمالي</Text>
            <Text style={[s.summaryValue, { fontSize: 18, color: c.primary }]}>{money(grandTotal)}</Text>
          </View>
        </PosSheetSection>

        <PosSheetSection label="الدفع">
          <View style={[flexRow, { alignItems: 'center', gap: 12 }]}>
            <MaterialIcons name={paymentIcon} size={24} color={c.primary} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>طريقة الدفع</Text>
                <Text style={s.summaryValue}>{paymentLabels[paymentType] ?? paymentType}</Text>
              </View>
              {paymentType === 'gift_card' && giftCard ? (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>بطاقة الهدايا</Text>
                  <Text style={s.summaryValue}>{money(giftAmount)}</Text>
                </View>
              ) : null}
              {cashDue > 0.01 || paymentType !== 'gift_card' ? (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>المدفوع</Text>
                  <Text style={s.summaryValue}>{money(paymentType === 'gift_card' ? paid : paid)}</Text>
                </View>
              ) : null}
              {change > 0 ? (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>الباقي للعميل</Text>
                  <Text style={[s.summaryValue, { color: c.success }]}>{money(change)}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </PosSheetSection>

        <View style={s.stickyFooter}>
          <AppButton title="تأكيد البيع" onPress={onConfirm} loading={loading} fullWidth size="lg" />
          <AppButton title="رجوع للتعديل" variant="outline" onPress={onClose} fullWidth />
        </View>
      </View>
    </AppBottomSheet>
  );
}
