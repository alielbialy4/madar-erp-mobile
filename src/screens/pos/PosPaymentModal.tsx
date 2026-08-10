import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RtlModalRoot } from '@/components/layout/RtlModalRoot';
import { AppText as Text } from '@/components/ui/AppText';
import { AppButton, AppDatePicker, AppInput, AppSelect } from '@/components/ui';
import type { Customer, FinancialAccount, PosCheckoutPaymentType } from '@/types/api';
import { PosPaymentDeliverySection } from './PosPaymentDeliverySection';
import type { SplitLine } from './SplitPaymentSheet';
import {
  PosCollapsibleSection,
  PosPaymentMethodGrid,
  PosSheetSection,
  PosTotalHero,
  usePosSheetStyles,
} from '@/components/pos/posSheetUi';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { money } from '@/utils/format';

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
  customerName?: string | null;
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  branchId?: string | null;
  shiftVaultId?: string | null;
  onCustomerCreated: (customer: Customer) => void;
  financialAccounts: FinancialAccount[];
  paymentAccountId: string;
  onPaymentAccountIdChange: (id: string) => void;
  splitLines: SplitLine[];
  onSplitLinesChange: (lines: SplitLine[]) => void;
  onConfirm: () => void;
  loading?: boolean;
  subtotal: number;
  discount: number;
  totalBeforeLoyalty: number;
  promotionDiscount?: number;
  tax?: number;
  serviceCharge?: number;
  deliveryFeeSummary?: number;
  loyaltyPointsRedeemed?: number;
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

export function PosPaymentModal({
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
  customerName,
  customers,
  selectedCustomer,
  onSelectCustomer,
  branchId,
  shiftVaultId,
  onCustomerCreated,
  financialAccounts,
  paymentAccountId,
  onPaymentAccountIdChange,
  splitLines,
  onSplitLinesChange,
  onConfirm,
  loading,
  subtotal,
  discount,
  totalBeforeLoyalty,
  promotionDiscount = 0,
  tax = 0,
  serviceCharge = 0,
  deliveryFeeSummary = 0,
  loyaltyPointsRedeemed = 0,
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
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [shellHeight, setShellHeight] = useState(height);
  const edgeInset = width >= 600 ? spacing.md : 0;
  const modalWidth = width - edgeInset * 2;
  const isLandscape = width > height;
  const isWideLayout = width >= 768;
  const useStackFooter = !isWideLayout || isLandscape;
  const androidNavFallback = Platform.OS === 'android' ? 20 : 0;
  const footerSafeBottom = Math.max(insets.bottom, androidNavFallback) + spacing.md;
  const modalHeightRatio = isLandscape ? 0.88 : 0.92;
  const modalMaxHeight = Math.floor(shellHeight * modalHeightRatio);
  const accountForMethod = useCallback(
    (method: string) => financialAccounts.find((account) => account.payment_method === method
      && account.is_active !== false
      && account.allow_sales !== false
      && (method !== 'cash' || !shiftVaultId || account.legacy_vault_id === shiftVaultId)),
    [financialAccounts, shiftVaultId],
  );
  const accountsForMethod = useCallback(
    (method: string) => financialAccounts.filter((account) => account.payment_method === method
      && account.is_active !== false
      && account.allow_sales !== false
      && (method !== 'cash' || !shiftVaultId || account.legacy_vault_id === shiftVaultId)),
    [financialAccounts, shiftVaultId],
  );
  const accountsEmpty = financialAccounts.length === 0;
  const orderScrollRef = useRef<ScrollView>(null);
  const combinedScrollRef = useRef<ScrollView>(null);
  const deliveryScrollY = useRef(0);

  useEffect(() => {
    if (!visible || !needsDelivery) return;
    const timer = setTimeout(() => {
      const scrollRef = isWideLayout ? orderScrollRef : combinedScrollRef;
      scrollRef.current?.scrollTo({ y: Math.max(0, deliveryScrollY.current - 12), animated: true });
    }, 220);
    return () => clearTimeout(timer);
  }, [visible, needsDelivery, isWideLayout]);

  useEffect(() => {
    if (!visible || paymentType !== 'split') return;
    if (splitLines.length >= 2) return;
    onSplitLinesChange([
      { payment_method: 'cash', financial_account_id: accountForMethod('cash')?.id ?? '', amount: '' },
      { payment_method: 'card', financial_account_id: accountForMethod('card')?.id ?? '', amount: '' },
    ]);
  }, [visible, paymentType, accountForMethod, splitLines.length, onSplitLinesChange]);

  useEffect(() => {
    if (!visible || paymentType === 'split' || paymentType === 'wallet' || paymentType === 'credit' || paymentType === 'layaway' || paymentType === 'gift_card') return;
    if (!paymentAccountId || !accountsForMethod(paymentType).some((account) => account.id === paymentAccountId)) {
      onPaymentAccountIdChange(accountForMethod(paymentType)?.id ?? '');
    }
  }, [visible, paymentType, accountForMethod, accountsForMethod, paymentAccountId, onPaymentAccountIdChange]);

  const splitTotalPaid = splitLines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  const splitMismatch = Math.abs(splitTotalPaid - amountDue) > 0.02;
  const activeSplitLines = splitLines.filter((l) => (parseFloat(l.amount) || 0) > 0);

  const updateSplitLine = (index: number, field: keyof SplitLine, value: string) => {
    onSplitLinesChange(splitLines.map((l, i) => {
      if (i !== index) return l;
      if (field === 'payment_method') {
        const method = value as typeof l.payment_method;
        return { ...l, payment_method: method, financial_account_id: method === 'wallet' ? '' : accountForMethod(method)?.id ?? '' };
      }
      return { ...l, [field]: value };
    }));
  };

  const addSplitLine = () => {
    onSplitLinesChange([
      ...splitLines,
      { payment_method: 'card', financial_account_id: accountForMethod('card')?.id ?? '', amount: '' },
    ]);
  };

  const removeSplitLine = (index: number) => {
    onSplitLinesChange(splitLines.filter((_, i) => i !== index));
  };
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

  // Match front PaymentModal buildPaymentOptions: cash, card, e-wallet, instapay, credit only.
  const paymentOptions = useMemo(() => {
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
      { key: 'bank_transfer', label: 'تحويل بنكي', icon: 'account-balance' },
      { key: 'payment_gateway', label: 'بوابة دفع', icon: 'language' },
      { key: 'credit', label: 'آجل', icon: 'schedule' },
      { key: 'layaway', label: 'تقسيط', icon: 'event' },
      { key: 'split', label: 'دفع مقسم', icon: 'call-split' },
    ];
    return base.map((opt) => ({
      key: opt.key,
      label: opt.label,
      icon: opt.icon,
      brandTile: opt.brandTile,
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

  const splitHasInvalidAccount = activeSplitLines.some(
    (line) => line.payment_method !== 'wallet'
      && !accountsForMethod(line.payment_method).some((account) => account.id === line.financial_account_id),
  );
  const requiresAccount = ['cash', 'card', 'electronic_wallet', 'instapay', 'bank_transfer', 'payment_gateway'].includes(paymentType);
  const confirmDisabled =
    (paymentType === 'split' && (activeSplitLines.length < 2 || splitMismatch || accountsEmpty || splitHasInvalidAccount)) ||
    (requiresAccount && !paymentAccountId) ||
    (paymentType === 'wallet' && (walletBalance == null || walletBalance < cashDue)) ||
    ((paymentType === 'electronic_wallet' || paymentType === 'instapay') && !isOnline) ||
    (paymentType === 'gift_card' && !isOnline) ||
    (paymentType === 'gift_card' && !appliedGiftCard) ||
    (paymentType === 'gift_card' &&
      appliedGiftCard &&
      cashDue > 0.01 &&
      (Number(paid) || 0) < cashDue - 0.01) ||
    (paymentType === 'credit' && !hasCustomer) ||
    (paymentType === 'layaway' && (!hasCustomer || !isOnline)) ||
    (paymentType === 'layaway' && (parseInt(layawayTermMonths, 10) || 0) < 1) ||
    (paymentType === 'layaway' && !layawayFirstDueDate.trim()) ||
    (paymentType === 'layaway' && layawayDownPayment > layawayFinalTotal + 0.01) ||
    (needsDelivery &&
      (!hasCustomer ||
        !deliveryAddress.trim() ||
        !(deliveryPhone.trim() || selectedCustomer?.phone)));

  const loyaltyCapTotal = amountDue + loyaltyDiscount;
  const loyaltyError =
    loyaltyPointsNum > 0 && !hasCustomer
      ? 'يجب اختيار عميل لاستبدال النقاط'
      : loyaltyPointsNum > 0 && pointsBalance != null && loyaltyPointsNum > pointsBalance
        ? 'النقاط أكثر من الرصيد المتاح'
        : loyaltyPointsNum > 0 && loyaltyDiscount > loyaltyCapTotal + 0.01
          ? 'خصم النقاط أكبر من المبلغ المستحق'
          : null;

  const showPaidField =
    (paymentType !== 'split' && paymentType !== 'gift_card' && paymentType !== 'layaway') ||
    (paymentType === 'gift_card' && cashDue > 0.01);

  const couponDiscount = appliedCoupon?.discount ?? 0;
  const grandTotal = Math.max(0, totalBeforeLoyalty - loyaltyDiscount);
  const giftAmount = paymentType === 'gift_card' && appliedGiftCard ? appliedGiftCard.amount : 0;
  const paidAmount = Number(paid) || 0;
  const cashChange = paymentType === 'cash' ? Math.max(0, paidAmount - cashDue) : 0;
  const paymentTypeLabel = paymentOptions.find((option) => option.key === paymentType)?.label ?? 'الدفع';

  const modalStyles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: edgeInset,
          paddingTop: insets.top + spacing.sm,
        },
        backdropPress: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.52)',
        },
        dialog: {
          width: modalWidth,
          alignSelf: 'center',
          height: modalMaxHeight,
          maxHeight: modalMaxHeight,
          flexDirection: 'column',
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          borderBottomLeftRadius: isWideLayout ? radius.xl : 0,
          borderBottomRightRadius: isWideLayout ? radius.xl : 0,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.borderSubtle,
        },
        headerBar: {
          flexShrink: 0,
          ...flexRow,
          alignItems: 'center',
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.md,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          borderBottomWidth: 1,
          borderBottomColor: c.borderSubtle,
          backgroundColor: c.surface,
          overflow: 'hidden',
        },
        headerText: { flex: 1, minWidth: 0, gap: spacing.xs },
        headerIcon: {
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: c.surfaceMuted,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: {
          ...textStart,
          fontSize: isWideLayout ? typography.pageTitle : typography.sectionTitle,
          lineHeight: isWideLayout ? 32 : 24,
          fontFamily: fonts.extraBold,
          fontWeight: '800',
          color: c.text,
        },
        headerSubtitle: {
          ...textStart,
          fontSize: typography.small,
          lineHeight: 18,
          fontFamily: fonts.medium,
          color: c.textMuted,
        },
        closeBtn: {
          width: 40,
          height: 40,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          backgroundColor: c.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        body: { flex: 1, minHeight: 0, overflow: 'hidden' },
        bodyRow: { flex: 1, minHeight: 0, ...flexRow, alignItems: 'stretch' },
        asideCol: {
          width: isWideLayout ? Math.min(360, modalWidth * 0.38) : undefined,
          flex: isWideLayout ? 0 : undefined,
          minHeight: 0,
        },
        mainCol: { flex: 1, minWidth: 0, minHeight: 0 },
        scroll: { flex: 1, minHeight: 0 },
        scrollContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
        footer: {
          flexShrink: 0,
          zIndex: 2,
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: footerSafeBottom,
          borderTopWidth: 1,
          borderTopColor: c.borderSubtle,
          backgroundColor: c.surface,
        },
        footerErrorBanner: { marginBottom: spacing.xs },
        footerRow: { ...flexRow, gap: spacing.sm, alignItems: 'stretch' },
        footerStack: { gap: spacing.sm },
        confirmBtn: { flex: 2, minWidth: 0, minHeight: 56 },
        closeFooterBtn: { flex: 1, minWidth: 0, minHeight: 48 },
      }),
    [c, modalWidth, modalMaxHeight, edgeInset, isWideLayout, insets.top, footerSafeBottom],
  );

  const paymentAside = (
    <>
      <PosTotalHero label="المبلغ المطلوب تحصيله" amount={money(amountDue)} hint="القيمة النهائية بعد الخصومات" />
      <PosPaymentMethodGrid
        value={paymentType === 'gift_card' ? 'gift_card' : paymentType}
        options={paymentOptions}
        onChange={(k) => onPaymentTypeChange(k as PosCheckoutPaymentType)}
      />
      {requiresAccount ? (
        <PosSheetSection label="حساب التحصيل">
          {accountsForMethod(paymentType).length === 0 ? (
            <Text style={s.errorText}>لا يوجد حساب نشط متاح لهذه الطريقة في الفرع الحالي.</Text>
          ) : (
            <AppSelect
              label="الحساب المالي"
              value={paymentAccountId}
              onChange={onPaymentAccountIdChange}
              options={accountsForMethod(paymentType).map((account) => ({
                label: [account.name, account.provider_name, account.masked_identifier].filter(Boolean).join(' · '),
                value: account.id,
              }))}
            />
          )}
        </PosSheetSection>
      ) : null}
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
          {paymentType === 'cash' && paidAmount > 0 ? (
            <Text style={[local.hint, cashChange > 0 && { color: c.success, fontFamily: fonts.bold }]}>
              {cashChange > 0
                ? `الباقي للعميل: ${money(cashChange)}`
                : `المتبقي للتحصيل: ${money(Math.max(0, cashDue - paidAmount))}`}
            </Text>
          ) : null}
        </PosSheetSection>
      ) : null}
    </>
  );

  const summaryContent = (
    <>
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
      {couponDiscount > 0 && discount <= 0 && appliedCoupon ? (
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>كوبون ({appliedCoupon.coupon.code})</Text>
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
      {deliveryFeeSummary > 0 ? (
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>رسوم التوصيل</Text>
          <Text style={s.summaryValue}>{money(deliveryFeeSummary)}</Text>
        </View>
      ) : null}
      {loyaltyDiscount > 0 ? (
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>نقاط ولاء ({loyaltyPointsRedeemed})</Text>
          <Text style={[s.summaryValue, s.summaryDiscount]}>-{money(loyaltyDiscount)}</Text>
        </View>
      ) : null}
      {giftAmount > 0 && appliedGiftCard ? (
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>بطاقة هدايا ({appliedGiftCard.code})</Text>
          <Text style={[s.summaryValue, s.summaryDiscount]}>-{money(giftAmount)}</Text>
        </View>
      ) : null}
      <View style={s.divider} />
      <View style={s.summaryRow}>
        <Text style={[s.summaryLabel, { color: c.text, fontFamily: fonts.bold }]}>الإجمالي</Text>
        <Text style={[s.summaryValue, { fontSize: 18, color: c.primary }]}>{money(grandTotal)}</Text>
      </View>
      {customerName || selectedTableName ? (
        <Text style={local.msg}>
          {[customerName ? `العميل: ${customerName}` : 'بيع بدون عميل', selectedTableName ? `الطاولة: ${selectedTableName}` : null]
            .filter(Boolean)
            .join(' • ')}
        </Text>
      ) : null}
    </>
  );

  const customerDeliveryPanel = (
    <View
      onLayout={(event) => {
        deliveryScrollY.current = event.nativeEvent.layout.y;
      }}
    >
      <PosPaymentDeliverySection
        active={visible}
        isOnline={isOnline}
        branchId={branchId}
        customers={customers}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={onSelectCustomer}
        onCustomerCreated={onCustomerCreated}
        needsDelivery={needsDelivery}
        deliveryZones={deliveryZones}
        deliveryZoneId={deliveryZoneId}
        onDeliveryZoneChange={onDeliveryZoneChange}
        deliveryAddress={deliveryAddress}
        onDeliveryAddressChange={onDeliveryAddressChange}
        deliveryPhone={deliveryPhone}
        onDeliveryPhoneChange={onDeliveryPhoneChange}
        deliveryFee={deliveryFee}
        customerOnly={!!selectedTableName}
        needsDeliveryValue={needsDelivery}
        onNeedsDeliveryChange={onNeedsDeliveryChange}
      />
    </View>
  );

  const formMain = (
    <View style={s.root}>
        {selectedTableName ? (
          <PosSheetSection label="الطاولة">
            <Text style={local.msg}>صالة — {selectedTableName}</Text>
          </PosSheetSection>
        ) : null}

        {paymentType === 'credit' || paymentType === 'layaway' ? customerDeliveryPanel : null}

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
            {accountsEmpty ? (
              <Text style={s.errorText}>لا توجد حسابات دفع متاحة للدفع المقسم.</Text>
            ) : (
              <>
                <View style={s.splitMeter}>
                  <View style={s.meterBox}>
                    <Text style={[s.meterValue, s.meterDue]}>{money(amountDue)}</Text>
                    <Text style={s.meterLabel}>المستحق</Text>
                  </View>
                  <View style={s.meterBox}>
                    <Text style={[s.meterValue, s.meterPaid]}>{money(splitTotalPaid)}</Text>
                    <Text style={s.meterLabel}>المدفوع</Text>
                  </View>
                  <View style={s.meterBox}>
                    <Text style={[s.meterValue, s.meterRemain]}>{money(Math.max(0, amountDue - splitTotalPaid))}</Text>
                    <Text style={s.meterLabel}>المتبقي</Text>
                  </View>
                </View>
                {splitMismatch && splitTotalPaid > 0 ? (
                  <View style={s.errorBanner}>
                    <Text style={s.errorText}>فرق: {money(amountDue - splitTotalPaid)} — عدّل المبالغ</Text>
                  </View>
                ) : null}
                <View style={{ gap: spacing.md }}>
                  {splitLines.map((item, index) => (
                    <View key={index} style={s.lineCard}>
                      <View style={[flexRow, { justifyContent: 'space-between', alignItems: 'center' }]}>
                        <Text style={{ ...textStart, fontFamily: fonts.bold, fontSize: typography.body, color: c.text }}>
                          خط دفع {index + 1}
                        </Text>
                        {splitLines.length > 2 ? (
                          <Pressable onPress={() => removeSplitLine(index)} hitSlop={8}>
                            <MaterialIcons name="delete-outline" size={22} color={c.danger} />
                          </Pressable>
                        ) : null}
                      </View>
                      <AppSelect
                        label="طريقة الدفع"
                        value={item.payment_method}
                        onChange={(v) => updateSplitLine(index, 'payment_method', v)}
                        options={[
                          { label: 'نقدي', value: 'cash' },
                          { label: 'بطاقة', value: 'card' },
                          { label: 'محافظ إلكترونية', value: 'electronic_wallet' },
                          { label: 'إنستا باي', value: 'instapay' },
                          { label: 'تحويل بنكي', value: 'bank_transfer' },
                          { label: 'بوابة دفع', value: 'payment_gateway' },
                          ...(hasCustomer ? [{ label: 'محفظة', value: 'wallet' }] : []),
                        ]}
                      />
                      <AppInput
                        label="المبلغ"
                        keyboardType="decimal-pad"
                        value={item.amount}
                        onChangeText={(v) => updateSplitLine(index, 'amount', v)}
                        placeholder="0.00"
                      />
                      {item.payment_method !== 'wallet' ? (
                        <AppSelect
                          label="حساب الدفع"
                          value={item.financial_account_id}
                          onChange={(v) => updateSplitLine(index, 'financial_account_id', v)}
                          options={accountsForMethod(item.payment_method).map((account) => ({
                            label: [account.name, account.provider_name, account.masked_identifier].filter(Boolean).join(' · '),
                            value: account.id,
                          }))}
                        />
                      ) : null}
                    </View>
                  ))}
                </View>
                <AppButton title="إضافة خط" variant="outline" onPress={addSplitLine} fullWidth />
              </>
            )}
          </PosSheetSection>
        ) : null}

        {paymentType !== 'credit' && paymentType !== 'layaway' ? customerDeliveryPanel : null}

        <PosCollapsibleSection
          label="ملخص المبالغ"
          summary={`الإجمالي: ${money(grandTotal)}`}
          defaultOpen={!isWideLayout}
        >
          {summaryContent}
        </PosCollapsibleSection>

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

    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <RtlModalRoot style={modalStyles.shell}>
        <View
          style={{ flex: 1, justifyContent: 'flex-end' }}
          onLayout={(event: LayoutChangeEvent) => setShellHeight(event.nativeEvent.layout.height)}
        >
        <Pressable
          style={modalStyles.backdropPress}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="إغلاق"
        />
        <View style={modalStyles.dialog}>
          <View style={modalStyles.headerBar}>
            <View style={modalStyles.headerIcon}>
              <MaterialIcons name="payments" size={22} color={c.primary} />
            </View>
            <View style={modalStyles.headerText}>
              <Text style={modalStyles.headerTitle} numberOfLines={1}>
                إتمام البيع
              </Text>
              <Text style={modalStyles.headerSubtitle} numberOfLines={2}>
                اختر طريقة الدفع ثم أكّد العملية
              </Text>
            </View>
            <Pressable onPress={onClose} style={modalStyles.closeBtn} accessibilityLabel="إغلاق">
              <MaterialIcons name="close" size={22} color={c.text} />
            </Pressable>
          </View>

          <View style={modalStyles.body}>
            {isWideLayout ? (
              <View style={modalStyles.bodyRow}>
                <ScrollView
                  ref={orderScrollRef}
                  style={[modalStyles.scroll, modalStyles.mainCol]}
                  contentContainerStyle={modalStyles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  bounces={false}
                >
                  {formMain}
                </ScrollView>
                <ScrollView
                  style={[modalStyles.scroll, modalStyles.asideCol]}
                  contentContainerStyle={modalStyles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  bounces={false}
                >
                  {paymentAside}
                </ScrollView>
              </View>
            ) : (
              <ScrollView
                ref={combinedScrollRef}
                style={modalStyles.scroll}
                contentContainerStyle={modalStyles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                bounces={false}
              >
                {paymentAside}
                {formMain}
              </ScrollView>
            )}
          </View>

          <View style={modalStyles.footer}>
            {checkoutMessage ? (
              <View style={[s.warningBanner, modalStyles.footerErrorBanner]}>
                <Text style={s.warningText}>{checkoutMessage}</Text>
              </View>
            ) : null}
            {useStackFooter ? (
              <View style={modalStyles.footerStack}>
                <AppButton
                  title={`تحصيل ${money(amountDue)} · ${paymentTypeLabel}`}
                  onPress={onConfirm}
                  loading={loading}
                  disabled={confirmDisabled || !!loyaltyError}
                  size="xl"
                  fullWidth
                />
              </View>
            ) : (
              <View style={modalStyles.footerRow}>
                <AppButton
                  title="إغلاق"
                  variant="outline"
                  onPress={onClose}
                  style={modalStyles.closeFooterBtn}
                  size="lg"
                />
                <AppButton
                  title={`تحصيل ${money(amountDue)} · ${paymentTypeLabel}`}
                  onPress={onConfirm}
                  loading={loading}
                  disabled={confirmDisabled || !!loyaltyError}
                  style={modalStyles.confirmBtn}
                  size="xl"
                />
              </View>
            )}
          </View>
        </View>
        </View>
      </RtlModalRoot>
    </Modal>
  );
}
