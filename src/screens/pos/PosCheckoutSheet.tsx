import React, { useMemo } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput } from '@/components/ui';
import {
  PosPaymentMethodGrid,
  PosSheetHeader,
  PosSheetSection,
  PosTotalHero,
  usePosSheetStyles,
} from '@/components/pos/posSheetUi';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { money } from '@/utils/format';
import type { PosCheckoutPaymentType } from '@/types/api';

type CouponState = { coupon: { code: string }; discount: number } | null;

type GiftCardState = { id: number; code: string; balance: number; amount: number } | null;

type Props = {
  visible: boolean;
  onClose: () => void;
  amountDue: number;
  walletText: string | null;
  walletBalance: number | null;
  pointsBalance: number | null;
  loyaltyEgpPerPoint: number;
  loyaltyPointsInput: string;
  onLoyaltyPointsInputChange: (v: string) => void;
  loyaltyDiscount: number;
  loyaltyBlockedOffline?: boolean;
  hasCustomer: boolean;
  isOnline: boolean;
  paymentType: PosCheckoutPaymentType;
  onPaymentTypeChange: (v: PosCheckoutPaymentType) => void;
  paid: string;
  onPaidChange: (v: string) => void;
  allowManualDiscount: boolean;
  manualDiscount: string;
  onManualDiscountChange: (v: string) => void;
  allowCoupons: boolean;
  couponCode: string;
  onCouponCodeChange: (v: string) => void;
  appliedCoupon: CouponState;
  onValidateCoupon: () => void;
  onRemoveCoupon: () => void;
  couponMessage: string | null;
  giftCardCode: string;
  onGiftCardCodeChange: (v: string) => void;
  onValidateGiftCard: () => void;
  onClearGiftCard: () => void;
  appliedGiftCard: GiftCardState;
  giftCardMessage: string | null;
  notes: string;
  onNotesChange: (v: string) => void;
  checkoutMessage: string | null;
  vaultsEmpty: boolean;
  onOpenSplit: () => void;
  onReview: () => void;
  splitLinesCount: number;
};

export function PosCheckoutSheet({
  visible,
  onClose,
  amountDue,
  walletText,
  walletBalance,
  pointsBalance,
  loyaltyEgpPerPoint,
  loyaltyPointsInput,
  onLoyaltyPointsInputChange,
  loyaltyDiscount,
  loyaltyBlockedOffline,
  hasCustomer,
  isOnline,
  paymentType,
  onPaymentTypeChange,
  paid,
  onPaidChange,
  allowManualDiscount,
  manualDiscount,
  onManualDiscountChange,
  allowCoupons,
  couponCode,
  onCouponCodeChange,
  appliedCoupon,
  onValidateCoupon,
  onRemoveCoupon,
  couponMessage,
  giftCardCode,
  onGiftCardCodeChange,
  onValidateGiftCard,
  onClearGiftCard,
  appliedGiftCard,
  giftCardMessage,
  notes,
  onNotesChange,
  checkoutMessage,
  vaultsEmpty,
  onOpenSplit,
  onReview,
  splitLinesCount,
}: Props) {
  const c = useColors();
  const s = usePosSheetStyles();
  const local = useMemo(
    () =>
      StyleSheet.create({
        couponRow: { ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
        couponApplied: { ...textStart, flex: 1, fontFamily: fonts.bold, fontSize: typography.small, color: c.success },
        msg: { ...textStart, fontSize: typography.small, fontFamily: fonts.medium, color: c.textMuted },
        hint: { ...textStart, fontSize: typography.tiny, color: c.textCaption, fontFamily: fonts.regular },
      }),
    [c],
  );

  const loyaltyPointsNum = useMemo(() => {
    const n = parseInt(loyaltyPointsInput, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [loyaltyPointsInput]);

  const paymentOptions = useMemo((): { key: string; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] => {
    const base: { key: string; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
      { key: 'cash', label: 'نقدي', icon: 'payments' },
      { key: 'card', label: 'بطاقة', icon: 'credit-card' },
      { key: 'credit', label: 'آجل', icon: 'schedule' },
    ];
    if (hasCustomer) base.push({ key: 'wallet', label: 'محفظة', icon: 'account-balance-wallet' });
    base.push({ key: 'gift_card', label: 'بطاقة هدايا', icon: 'card-giftcard' });
    base.push({ key: 'split', label: 'مقسم', icon: 'call-split' });
    return base;
  }, [hasCustomer]);

  const cashDue = useMemo(() => {
    if (paymentType === 'gift_card' && appliedGiftCard) {
      return Math.max(0, amountDue - appliedGiftCard.amount);
    }
    return amountDue;
  }, [amountDue, paymentType, appliedGiftCard]);

  const reviewDisabled =
    (paymentType === 'split' && splitLinesCount === 0) ||
    (paymentType === 'gift_card' && !isOnline) ||
    (paymentType === 'gift_card' && !appliedGiftCard) ||
    (paymentType === 'gift_card' &&
      appliedGiftCard &&
      cashDue > 0.01 &&
      (Number(paid) || 0) < cashDue - 0.01);

  const totalBeforeLoyalty = amountDue + loyaltyDiscount;
  const loyaltyError =
    loyaltyPointsNum > 0 && !hasCustomer
      ? 'يجب اختيار عميل لاستبدال النقاط'
      : loyaltyPointsNum > 0 && pointsBalance != null && loyaltyPointsNum > pointsBalance
        ? 'النقاط أكثر من الرصيد المتاح'
        : loyaltyPointsNum > 0 && loyaltyDiscount > totalBeforeLoyalty + 0.01
          ? 'خصم النقاط أكبر من المبلغ المستحق'
          : null;

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <View style={s.root}>
        <PosSheetHeader title="إتمام البيع" subtitle="اختر الدفع، الخصومات، ثم راجع الطلب قبل التأكيد" />
        <PosTotalHero label="المبلغ المستحق" amount={money(amountDue)} hint="بعد الخصومات والنقاط وبطاقة الهدايا" />

        {walletText ? (
          <View style={s.walletBanner}>
            <Text style={s.walletText}>{walletText}</Text>
          </View>
        ) : null}

        {hasCustomer ? (
          <PosSheetSection label="نقاط الولاء">
            {loyaltyBlockedOffline ? (
              <Text style={local.hint}>استبدال النقاط يحتاج اتصالاً بالخادم للتحقق من الرصيد.</Text>
            ) : (
              <>
                <Text style={local.hint}>
                  الرصيد: {pointsBalance ?? 0} نقطة — سعر النقطة: {money(loyaltyEgpPerPoint)}
                </Text>
                <AppInput
                  label="نقاط للاستبدال"
                  keyboardType="number-pad"
                  value={loyaltyPointsInput}
                  onChangeText={onLoyaltyPointsInputChange}
                  placeholder="0"
                />
                {loyaltyDiscount > 0 ? (
                  <Text style={local.couponApplied}>خصم النقاط: -{money(loyaltyDiscount)}</Text>
                ) : null}
                {loyaltyError ? <Text style={s.errorText}>{loyaltyError}</Text> : null}
              </>
            )}
          </PosSheetSection>
        ) : null}

        <PosPaymentMethodGrid
          value={paymentType === 'gift_card' ? 'gift_card' : paymentType}
          options={paymentOptions}
          onChange={(k) => onPaymentTypeChange(k as PosCheckoutPaymentType)}
        />

        {paymentType === 'wallet' && walletBalance !== null && walletBalance < cashDue ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>رصيد المحفظة غير كافٍ ({money(walletBalance)})</Text>
          </View>
        ) : null}

        {paymentType === 'gift_card' ? (
          <PosSheetSection label="بطاقة الهدايا">
            {!isOnline ? (
              <Text style={s.errorText}>الدفع ببطاقة الهدايا يحتاج اتصالاً بالخادم للتحقق من الرصيد.</Text>
            ) : !appliedGiftCard ? (
              <>
                <AppInput label="كود البطاقة" value={giftCardCode} onChangeText={onGiftCardCodeChange} placeholder="أدخل الكود" />
                <AppButton title="تحقق من الرصيد" variant="outline" onPress={onValidateGiftCard} disabled={!giftCardCode.trim()} size="sm" />
              </>
            ) : (
              <View style={local.couponRow}>
                <Text style={local.couponApplied}>
                  {appliedGiftCard.code}: رصيد {money(appliedGiftCard.balance)} — يُخصم {money(appliedGiftCard.amount)}
                </Text>
                <AppButton title="إزالة" variant="ghost" onPress={onClearGiftCard} size="sm" />
              </View>
            )}
            {giftCardMessage ? <Text style={local.msg}>{giftCardMessage}</Text> : null}
            {appliedGiftCard && cashDue > 0.01 ? (
              <Text style={local.hint}>المتبقي نقداً/بطاقة: {money(cashDue)}</Text>
            ) : null}
          </PosSheetSection>
        ) : null}

        {paymentType !== 'split' && paymentType !== 'gift_card' ? (
          <PosSheetSection label="المبلغ المدفوع">
            <AppInput label="المدفوع" keyboardType="numeric" value={paid} onChangeText={onPaidChange} />
          </PosSheetSection>
        ) : paymentType === 'gift_card' && cashDue > 0.01 ? (
          <PosSheetSection label="المبلغ المدفوع (الباقي)">
            <AppInput label="المدفوع" keyboardType="numeric" value={paid} onChangeText={onPaidChange} />
          </PosSheetSection>
        ) : paymentType === 'split' ? (
          <PosSheetSection label="الدفع المقسم">
            {vaultsEmpty ? (
              <Text style={s.errorText}>لا توجد خزنة متاحة للدفع المقسم.</Text>
            ) : (
              <>
                <Text style={local.msg}>
                  {splitLinesCount > 0
                    ? `تم إعداد ${splitLinesCount} خط/خطوط دفع`
                    : 'أضف خطوط الدفع ووزّع المبلغ على الخزن'}
                </Text>
                <AppButton title="إعداد الدفع المقسم" variant="secondary" onPress={onOpenSplit} fullWidth />
              </>
            )}
          </PosSheetSection>
        ) : null}

        {allowManualDiscount ? (
          <PosSheetSection label="خصم يدوي">
            <AppInput
              label="قيمة الخصم"
              keyboardType="numeric"
              value={manualDiscount}
              onChangeText={onManualDiscountChange}
              placeholder="0.00"
            />
          </PosSheetSection>
        ) : null}

        {allowCoupons ? (
          <PosSheetSection label="كوبون / عروض">
            {!appliedCoupon ? (
              <>
                <AppInput label="كود الكوبون" value={couponCode} onChangeText={onCouponCodeChange} placeholder="أدخل الكود" />
                <AppButton title="تحقق من الكوبون" variant="outline" onPress={onValidateCoupon} disabled={!couponCode.trim()} size="sm" />
              </>
            ) : (
              <View style={local.couponRow}>
                <Text style={local.couponApplied}>
                  {appliedCoupon.coupon.code}: -{money(appliedCoupon.discount)}
                </Text>
                <AppButton title="إزالة" variant="ghost" onPress={onRemoveCoupon} size="sm" />
              </View>
            )}
            {couponMessage ? <Text style={local.msg}>{couponMessage}</Text> : null}
          </PosSheetSection>
        ) : null}

        <PosSheetSection label="ملاحظات">
          <AppInput label="ملاحظات الطلب" value={notes} onChangeText={onNotesChange} multiline />
        </PosSheetSection>

        {checkoutMessage ? (
          <View style={s.warningBanner}>
            <Text style={s.warningText}>{checkoutMessage}</Text>
          </View>
        ) : null}

        <View style={s.stickyFooter}>
          <AppButton title="مراجعة الطلب والتأكيد" onPress={onReview} disabled={reviewDisabled || !!loyaltyError} size="lg" fullWidth />
          <AppButton title="إلغاء" variant="outline" onPress={onClose} fullWidth />
        </View>
      </View>
    </AppBottomSheet>
  );
}
