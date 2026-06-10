import React, { useMemo, type ReactNode } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppDatePicker, AppInput } from '@/components/ui';
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

function InputRow({ children }: { children: ReactNode }) {
  return <View style={{ ...flexRow, gap: spacing.sm, alignItems: 'flex-start' }}>{children}</View>;
}

function InputCol({ children, flex = 1 }: { children: ReactNode; flex?: number }) {
  return <View style={{ flex, minWidth: 0 }}>{children}</View>;
}

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
  manualDiscountPercent: string;
  onManualDiscountChange: (v: string) => void;
  onManualDiscountPercentChange: (v: string) => void;
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
  selectedTableName?: string | null;
  vaultsEmpty: boolean;
  onOpenSplit: () => void;
  onReview: () => void;
  splitLinesCount: number;
  layawayTermMonths: string;
  onLayawayTermMonthsChange: (v: string) => void;
  layawayMarkupPercent: string;
  onLayawayMarkupPercentChange: (v: string) => void;
  layawayFirstDueDate: string;
  onLayawayFirstDueDateChange: (v: string) => void;
  needsDelivery: boolean;
  onNeedsDeliveryChange: (v: boolean) => void;
  deliveryZones: { id: string; name: string; delivery_fee: number | string }[];
  deliveryZoneId: string;
  onDeliveryZoneChange: (v: string) => void;
  deliveryAddress: string;
  onDeliveryAddressChange: (v: string) => void;
  deliveryPhone: string;
  onDeliveryPhoneChange: (v: string) => void;
  deliveryFee: number;
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
  manualDiscountPercent,
  onManualDiscountChange,
  onManualDiscountPercentChange,
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
  selectedTableName,
  vaultsEmpty,
  onOpenSplit,
  onReview,
  splitLinesCount,
  layawayTermMonths,
  onLayawayTermMonthsChange,
  layawayMarkupPercent,
  onLayawayMarkupPercentChange,
  layawayFirstDueDate,
  onLayawayFirstDueDateChange,
  needsDelivery,
  onNeedsDeliveryChange,
  deliveryZones,
  deliveryZoneId,
  onDeliveryZoneChange,
  deliveryAddress,
  onDeliveryAddressChange,
  deliveryPhone,
  onDeliveryPhoneChange,
  deliveryFee,
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
    const base: {
      key: string;
      label: string;
      icon?: keyof typeof MaterialIcons.glyphMap;
      brandTile?: { backgroundColor: string; textColor: string; title: string };
    }[] = [
      { key: 'cash', label: 'نقدي', icon: 'payments' },
      { key: 'card', label: 'بطاقة', icon: 'credit-card' },
      {
        key: 'electronic_wallet',
        label: 'محافظ إلكترونية',
        brandTile: { backgroundColor: c.paymentVisaBg, textColor: c.onPrimary, title: 'محافظ\nإلكترونية' },
      },
      {
        key: 'instapay',
        label: 'إنستا باي',
        brandTile: { backgroundColor: c.paymentInstapayFg, textColor: c.onPrimary, title: 'InstaPay' },
      },
      { key: 'credit', label: 'آجل', icon: 'schedule' },
    ];
    base.push({ key: 'gift_card', label: 'بطاقة هدايا', icon: 'card-giftcard' });
    return base.map((opt) => ({
      key: opt.key,
      label: opt.label,
      icon: (opt.icon ?? 'account-balance-wallet') as keyof typeof MaterialIcons.glyphMap,
    }));
  }, [c.onPrimary, c.paymentInstapayFg, c.paymentVisaBg]);

  const cashDue = useMemo(() => {
    if (paymentType === 'gift_card' && appliedGiftCard) {
      return Math.max(0, amountDue - appliedGiftCard.amount);
    }
    return amountDue;
  }, [amountDue, paymentType, appliedGiftCard]);

  const layawayFinalTotal = useMemo(() => {
    const markup = parseFloat(layawayMarkupPercent) || 0;
    return Math.round(amountDue * (1 + markup / 100) * 100) / 100;
  }, [amountDue, layawayMarkupPercent]);

  const layawayDownPayment = Number(paid) || 0;
  const layawayRemaining = Math.max(0, layawayFinalTotal - layawayDownPayment);

  const reviewDisabled =
    (paymentType === 'split' && splitLinesCount === 0) ||
    (paymentType === 'wallet' && (walletBalance == null || walletBalance < cashDue)) ||
    ((paymentType === 'electronic_wallet' || paymentType === 'instapay') && !isOnline) ||
    (paymentType === 'gift_card' && !isOnline) ||
    (paymentType === 'gift_card' && !appliedGiftCard) ||
    (paymentType === 'gift_card' &&
      appliedGiftCard &&
      cashDue > 0.01 &&
      (Number(paid) || 0) < cashDue - 0.01) ||
    (paymentType === 'layaway' && (!hasCustomer || !isOnline)) ||
    (paymentType === 'layaway' && (parseInt(layawayTermMonths, 10) || 0) < 1) ||
    (paymentType === 'layaway' && !layawayFirstDueDate.trim()) ||
    (paymentType === 'layaway' && layawayDownPayment > layawayFinalTotal + 0.01) ||
    (needsDelivery && (!hasCustomer || !deliveryAddress.trim()));

  const totalBeforeLoyalty = amountDue + loyaltyDiscount;
  const loyaltyError =
    loyaltyPointsNum > 0 && !hasCustomer
      ? 'يجب اختيار عميل لاستبدال النقاط'
      : loyaltyPointsNum > 0 && pointsBalance != null && loyaltyPointsNum > pointsBalance
        ? 'النقاط أكثر من الرصيد المتاح'
        : loyaltyPointsNum > 0 && loyaltyDiscount > totalBeforeLoyalty + 0.01
          ? 'خصم النقاط أكبر من المبلغ المستحق'
          : null;

  const showPaidField =
    (paymentType !== 'split' && paymentType !== 'gift_card' && paymentType !== 'layaway') ||
    (paymentType === 'gift_card' && cashDue > 0.01);

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

        {hasCustomer || showPaidField ? (
          <PosSheetSection label="نقاط ودفع">
            <InputRow>
              {hasCustomer ? (
                <InputCol>
                  {loyaltyBlockedOffline ? (
                    <Text style={local.hint}>استبدال النقاط يحتاج اتصالاً بالخادم.</Text>
                  ) : (
                    <>
                      <AppInput
                        label="نقاط الولاء"
                        keyboardType="number-pad"
                        value={loyaltyPointsInput}
                        onChangeText={onLoyaltyPointsInputChange}
                        placeholder="0"
                      />
                      {loyaltyDiscount > 0 ? (
                        <Text style={local.couponApplied}>خصم: -{money(loyaltyDiscount)}</Text>
                      ) : null}
                      {loyaltyError ? <Text style={s.errorText}>{loyaltyError}</Text> : null}
                    </>
                  )}
                </InputCol>
              ) : null}
              {showPaidField ? (
                <InputCol>
                  <AppInput
                    label={paymentType === 'gift_card' ? 'المدفوع (الباقي)' : 'المدفوع'}
                    keyboardType="numeric"
                    value={paid}
                    onChangeText={onPaidChange}
                    placeholder="0.00"
                  />
                </InputCol>
              ) : null}
            </InputRow>
            {hasCustomer && !loyaltyBlockedOffline ? (
              <Text style={local.hint}>
                الرصيد: {pointsBalance ?? 0} نقطة — سعر النقطة: {money(loyaltyEgpPerPoint)}
              </Text>
            ) : null}
          </PosSheetSection>
        ) : null}

        <PosPaymentMethodGrid
          value={paymentType === 'gift_card' ? 'gift_card' : paymentType}
          options={paymentOptions}
          onChange={(k) => onPaymentTypeChange(k as PosCheckoutPaymentType)}
        />

        <PosSheetSection label="نوع الطلب">
          {selectedTableName ? (
            <Text style={local.msg}>صالة — {selectedTableName}</Text>
          ) : (
            <View style={local.couponRow}>
              <AppButton
                title="تيك أواي"
                variant={!needsDelivery ? 'primary' : 'outline'}
                onPress={() => onNeedsDeliveryChange(false)}
                size="sm"
                style={{ flex: 1 }}
              />
              <AppButton
                title="توصيل"
                variant={needsDelivery ? 'primary' : 'outline'}
                onPress={() => onNeedsDeliveryChange(true)}
                size="sm"
                style={{ flex: 1 }}
              />
            </View>
          )}
        </PosSheetSection>

        {needsDelivery ? (
          <PosSheetSection label="بيانات التوصيل">
            {!hasCustomer ? (
              <Text style={s.errorText}>يجب اختيار عميل قبل التوصيل.</Text>
            ) : (
              <>
                {deliveryZones.length > 0 ? (
                  <View style={{ gap: spacing.xs }}>
                    {deliveryZones.map((zone) => (
                      <AppButton
                        key={zone.id}
                        title={`${zone.name} — ${money(Number(zone.delivery_fee ?? 0))}`}
                        variant={deliveryZoneId === String(zone.id) ? 'primary' : 'outline'}
                        onPress={() => onDeliveryZoneChange(String(zone.id))}
                        size="sm"
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={local.hint}>لا توجد مناطق توصيل نشطة في الكتالوج.</Text>
                )}
                <InputRow>
                  <InputCol>
                    <AppInput
                      label="عنوان التوصيل *"
                      value={deliveryAddress}
                      onChangeText={onDeliveryAddressChange}
                      placeholder="العنوان الكامل"
                    />
                  </InputCol>
                  <InputCol>
                    <AppInput
                      label="هاتف التوصيل"
                      value={deliveryPhone}
                      onChangeText={onDeliveryPhoneChange}
                      placeholder="01xxxxxxxxx"
                      keyboardType="phone-pad"
                    />
                  </InputCol>
                </InputRow>
                {deliveryFee > 0 ? <Text style={local.hint}>رسوم التوصيل: {money(deliveryFee)}</Text> : null}
              </>
            )}
          </PosSheetSection>
        ) : null}

        {paymentType === 'wallet' && walletBalance == null ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>تعذر التحقق من رصيد المحفظة.</Text>
          </View>
        ) : null}

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
                <InputRow>
                  <InputCol flex={2}>
                    <AppInput
                      label="كود البطاقة"
                      value={giftCardCode}
                      onChangeText={onGiftCardCodeChange}
                      placeholder="أدخل الكود"
                    />
                  </InputCol>
                  <InputCol>
                    <View style={{ paddingTop: 22 }}>
                      <AppButton
                        title="تحقق"
                        variant="outline"
                        onPress={onValidateGiftCard}
                        disabled={!giftCardCode.trim()}
                        size="sm"
                        fullWidth
                      />
                    </View>
                  </InputCol>
                </InputRow>
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

        {paymentType === 'layaway' ? (
          <PosSheetSection label="شروط التقسيط">
            {!isOnline ? (
              <Text style={s.errorText}>بيع التقسيط يحتاج اتصالاً بالخادم.</Text>
            ) : !hasCustomer ? (
              <Text style={s.errorText}>يجب اختيار عميل قبل التقسيط.</Text>
            ) : (
              <>
                <InputRow>
                  <InputCol>
                    <AppInput
                      label="عدد الأقساط *"
                      keyboardType="number-pad"
                      value={layawayTermMonths}
                      onChangeText={onLayawayTermMonthsChange}
                      placeholder="12"
                    />
                  </InputCol>
                  <InputCol>
                    <AppInput
                      label="نسبة الزيادة %"
                      keyboardType="numeric"
                      value={layawayMarkupPercent}
                      onChangeText={onLayawayMarkupPercentChange}
                      placeholder="0"
                    />
                  </InputCol>
                </InputRow>
                <InputRow>
                  <InputCol>
                    <AppDatePicker
                      label="تاريخ أول قسط *"
                      value={layawayFirstDueDate}
                      onChange={onLayawayFirstDueDateChange}
                      minimumDate={new Date()}
                      required
                    />
                  </InputCol>
                  <InputCol>
                    <AppInput
                      label="الدفعة المقدمة *"
                      keyboardType="numeric"
                      value={paid}
                      onChangeText={onPaidChange}
                      placeholder="0.00"
                    />
                  </InputCol>
                </InputRow>
                <Text style={local.hint}>
                  الإجمالي بعد الزيادة: {money(layawayFinalTotal)} — المتبقي: {money(layawayRemaining)}
                </Text>
              </>
            )}
          </PosSheetSection>
        ) : null}

        {paymentType === 'split' ? (
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

        {allowManualDiscount || allowCoupons ? (
          <PosSheetSection label="خصومات وكوبونات">
            {allowManualDiscount ? (
              <InputRow>
                <InputCol>
                  <AppInput
                    label="خصم %"
                    keyboardType="decimal-pad"
                    value={manualDiscountPercent}
                    onChangeText={onManualDiscountPercentChange}
                    placeholder="0"
                  />
                </InputCol>
                <InputCol>
                  <AppInput
                    label="خصم مبلغ"
                    keyboardType="decimal-pad"
                    value={manualDiscount}
                    onChangeText={onManualDiscountChange}
                    placeholder="0.00"
                  />
                </InputCol>
              </InputRow>
            ) : null}
            {allowCoupons ? (
              !appliedCoupon ? (
                <>
                  <InputRow>
                    <InputCol flex={2}>
                      <AppInput
                        label="كود الكوبون"
                        value={couponCode}
                        onChangeText={onCouponCodeChange}
                        placeholder="أدخل الكود"
                      />
                    </InputCol>
                    <InputCol>
                      <View style={{ paddingTop: 22 }}>
                        <AppButton
                          title="تحقق"
                          variant="outline"
                          onPress={onValidateCoupon}
                          disabled={!couponCode.trim()}
                          size="sm"
                          fullWidth
                        />
                      </View>
                    </InputCol>
                  </InputRow>
                  {!isOnline ? (
                    <Text style={local.hint}>بدون اتصال: يُتحقق من الكوبون محلياً.</Text>
                  ) : null}
                </>
              ) : (
                <View style={local.couponRow}>
                  <Text style={local.couponApplied}>
                    {appliedCoupon.coupon.code}: -{money(appliedCoupon.discount)}
                  </Text>
                  <AppButton title="إزالة" variant="ghost" onPress={onRemoveCoupon} size="sm" />
                </View>
              )
            ) : null}
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
