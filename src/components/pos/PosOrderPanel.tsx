import React, { useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBadge, AppButton, AppSectionHeader } from '@/components/ui';
import { AppEmptyState } from '@/components/feedback';
import { flexRow, rtlDirection, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { cartLineKey, type CartLine } from '@/store/posStore';
import { money, numberText } from '@/utils/format';

type Props = {
  cart: CartLine[];
  effectiveTotal: number;
  subtotal: number;
  branchName?: string | null;
  orderTypeLabel?: string | null;
  shiftError: string | null;
  hasShift: boolean;
  pendingCount: number;
  selectedCustomerName?: string | null;
  selectedTableName?: string | null;
  walletText?: string | null;
  couponLabel?: string | null;
  manualDiscountLabel?: string | null;
  promotionLabel?: string | null;
  taxLabel?: string | null;
  serviceChargeLabel?: string | null;
  deliveryFeeLabel?: string | null;
  loyaltyLabel?: string | null;
  giftCardLabel?: string | null;
  splitPaid?: number | null;
  splitRemaining?: number | null;
  onSelectCustomer: () => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onSaveHoldCart?: () => void;
  onOpenHoldCarts?: () => void;
  onCashMovement?: () => void;
  onOpenTables?: () => void;
  onUpdateQty: (lineKey: string, delta: number) => void;
  onRemoveLine: (lineKey: string) => void;
  onPrintKitchen?: () => void;
  kitchenPrintEnabled?: boolean;
  /** Tablet split layout: denser cart chrome, utilities in top bar. */
  variant?: 'default' | 'tablet';
};

function lineOptionsPrice(line: CartLine): number {
  return (line.selected_options ?? []).reduce((sum, group) => {
    if (group.pricing_type === 'group_price') return sum + (Number(group.group_price) || 0);
    return sum + group.options.reduce((optionSum, option) => optionSum + (Number(option.option_price) || 0), 0);
  }, 0);
}

function PosCartIconBtn({
  icon,
  onPress,
  disabled,
  tone = 'default',
  accessibilityLabel,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger' | 'accent';
  accessibilityLabel: string;
}) {
  const c = useColors();
  const bg = tone === 'danger' ? c.softDanger : tone === 'accent' ? c.accentSoft : c.surfaceMuted;
  const border = tone === 'danger' ? c.softDangerBorder : tone === 'accent' ? c.accentBorder : c.borderSubtle;
  const iconColor = tone === 'danger' ? c.danger : tone === 'accent' ? c.accent : c.text;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          width: 48,
          height: 48,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <MaterialIcons name={icon} size={24} color={iconColor} />
    </Pressable>
  );
}

export function PosOrderPanel({
  cart,
  effectiveTotal,
  subtotal,
  branchName,
  orderTypeLabel,
  shiftError,
  hasShift,
  pendingCount,
  selectedCustomerName,
  selectedTableName,
  walletText,
  couponLabel,
  manualDiscountLabel,
  promotionLabel,
  taxLabel,
  serviceChargeLabel,
  deliveryFeeLabel,
  loyaltyLabel,
  giftCardLabel,
  splitPaid,
  splitRemaining,
  onSelectCustomer,
  onClearCart,
  onCheckout,
  onSaveHoldCart,
  onOpenHoldCarts,
  onCashMovement,
  onOpenTables,
  onUpdateQty,
  onRemoveLine,
  onPrintKitchen,
  kitchenPrintEnabled = false,
  variant = 'default',
}: Props) {
  const isTablet = variant === 'tablet';
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const c = useColors();
  const styles = useMemo(() => createStyles(c, isTablet), [c, isTablet]);

  const showCartUtilities = onSaveHoldCart || onOpenHoldCarts || onCashMovement || onOpenTables;
  const showKitchenPrint = Boolean(onPrintKitchen) && kitchenPrintEnabled;
  const selectedContext = [orderTypeLabel, selectedTableName ? `طاولة: ${selectedTableName}` : null, selectedCustomerName ? `عميل: ${selectedCustomerName}` : null]
    .filter(Boolean)
    .join(' • ');

  const handleClearCart = () => {
    if (cart.length === 0) return;
    Alert.alert('مسح السلة', 'هل تريد مسح جميع الأصناف من السلة؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'مسح', style: 'destructive', onPress: onClearCart },
    ]);
  };

  return (
    <View style={[styles.panel, rtlDirection]}>
      <View style={styles.header}>
        <AppSectionHeader title="الطلب الحالي" action={<AppBadge label={`${numberText(itemCount)} صنف`} tone="info" />} />
        <View style={styles.contextBlock}>
          <View style={styles.statusRow}>
            <AppBadge label={orderTypeLabel ?? 'تيك أواي'} tone={selectedTableName ? 'success' : 'default'} />
            <AppBadge label={hasShift ? 'وردية نشطة' : 'لا توجد وردية'} tone={hasShift ? 'success' : 'warning'} />
          </View>
          <Text style={styles.contextText} numberOfLines={2}>
            {branchName ?? 'بدون فرع'}{selectedContext ? ` • ${selectedContext}` : ''}
          </Text>
        </View>
      </View>

      {shiftError ? (
        <View style={styles.alertDanger}>
          <MaterialIcons name="error-outline" size={16} color={c.danger} />
          <Text style={styles.alertDangerText}>{shiftError}</Text>
        </View>
      ) : null}
      {!hasShift ? (
        <View style={styles.alertWarning}>
          <MaterialIcons name="warning" size={16} color={c.warning} />
          <Text style={styles.alertWarningText}>لا توجد وردية نشطة. افتح وردية لإتمام البيع.</Text>
        </View>
      ) : null}
      {pendingCount > 0 ? (
        <View style={styles.alertInfo}>
          <Text style={styles.alertInfoText}>طلبات محلية معلقة: {numberText(pendingCount)}</Text>
        </View>
      ) : null}
      {walletText ? <Text style={styles.walletText}>{walletText}</Text> : null}

      {cart.length === 0 ? (
        <View style={styles.emptyWrap}>
          <AppEmptyState
            title="السلة فارغة"
            message={isTablet ? 'اختر منتجات من الكتالوج على اليمين أو افتح الطاولات.' : 'اختر منتجات من الكتالوج.'}
          />
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item, i) => `${cartLineKey(item)}-${i}`}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const key = cartLineKey(item);
            const lineUnit = item.unit_price + lineOptionsPrice(item);
            const lineGross = lineUnit * item.quantity;
            const lineTotal = Math.max(0, lineGross - (item.discount || 0));
            return (
              <View style={styles.line}>
                <View style={styles.lineTop}>
                  <View style={styles.lineInfo}>
                    <Text style={styles.lineTitle} numberOfLines={2}>{item.product_name}</Text>
                    {item.variant_name ? <Text style={styles.lineOption}>الاختيار: {item.variant_name}</Text> : null}
                    {item.selected_options?.map((opt, j) => (
                      <Text key={j} style={styles.lineOption} numberOfLines={2}>
                        {opt.group_title}: {opt.options.map((o) => o.name).join(', ')}
                      </Text>
                    ))}
                    <View style={styles.lineMetaRow}>
                      <Text style={styles.lineMeta}>
                        {money(lineUnit)} × {numberText(item.quantity)}
                      </Text>
                      {item.discount > 0 ? <Text style={styles.lineDiscount}>-{money(item.discount)}</Text> : null}
                      {item.notes ? (
                        <View style={styles.noteRow}>
                          <MaterialIcons name="sticky-note-2" size={14} color={c.textMuted} />
                          <Text style={styles.lineOption} numberOfLines={1}>ملاحظة</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <Text style={styles.lineTotal}>{money(lineTotal)}</Text>
                </View>
                <View style={styles.qtyRow}>
                  <Pressable onPress={() => onUpdateQty(key, 1)} style={styles.qtyBtn}>
                    <MaterialIcons name="add" size={isTablet ? 20 : 18} color={c.accent} />
                  </Pressable>
                  <Text style={styles.qtyValue}>{numberText(item.quantity)}</Text>
                  <Pressable onPress={() => onUpdateQty(key, -1)} style={styles.qtyBtn}>
                    <MaterialIcons name="remove" size={isTablet ? 20 : 18} color={c.textMuted} />
                  </Pressable>
                  <Pressable onPress={() => onRemoveLine(key)} style={styles.removeBtn}>
                    <MaterialIcons name="delete-outline" size={isTablet ? 22 : 18} color={c.danger} />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <View style={styles.benefitsBox}>
          <Text style={styles.benefitsTitle}>العميل والخصومات</Text>
          <Text style={styles.benefitsText}>
            {selectedCustomerName ? `العميل: ${selectedCustomerName}` : 'بدون عميل محدد'}
          </Text>
          {walletText ? <Text style={styles.benefitsText}>{walletText}</Text> : null}
          {manualDiscountLabel || couponLabel || loyaltyLabel || giftCardLabel ? (
            <>
              {manualDiscountLabel ? <Text style={styles.discountText}>{manualDiscountLabel}</Text> : null}
              {couponLabel ? <Text style={styles.discountText}>{couponLabel}</Text> : null}
              {loyaltyLabel ? <Text style={styles.discountText}>{loyaltyLabel}</Text> : null}
              {giftCardLabel ? <Text style={styles.discountText}>{giftCardLabel}</Text> : null}
            </>
          ) : (
            <Text style={styles.benefitsHint}>الخصم والكوبون والمحفظة من شاشة الدفع.</Text>
          )}
        </View>
        <View style={styles.totalsSection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>المجموع الفرعي</Text>
            <Text style={styles.summaryValue}>{money(subtotal)}</Text>
          </View>
          {promotionLabel ? <Text style={styles.couponText}>{promotionLabel}</Text> : null}
          {manualDiscountLabel ? <Text style={styles.couponText}>{manualDiscountLabel}</Text> : null}
          {couponLabel ? <Text style={styles.couponText}>{couponLabel}</Text> : null}
          {taxLabel ? <Text style={styles.subtotalText}>{taxLabel}</Text> : null}
          {serviceChargeLabel ? <Text style={styles.subtotalText}>{serviceChargeLabel}</Text> : null}
          {deliveryFeeLabel ? <Text style={styles.subtotalText}>{deliveryFeeLabel}</Text> : null}
          {loyaltyLabel ? <Text style={styles.couponText}>{loyaltyLabel}</Text> : null}
          {giftCardLabel ? <Text style={styles.couponText}>{giftCardLabel}</Text> : null}
          {splitPaid != null ? <Text style={styles.subtotalText}>المدفوع: {money(splitPaid)}</Text> : null}
          {splitRemaining != null ? <Text style={styles.subtotalText}>المتبقي: {money(splitRemaining)}</Text> : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>الإجمالي</Text>
            <Text style={styles.totalValue}>{money(effectiveTotal)}</Text>
          </View>
        </View>
        {isTablet ? (
          <View style={styles.toolbarRow}>
            <PosCartIconBtn icon="person-outline" accessibilityLabel="اختيار عميل" onPress={onSelectCustomer} />
            {onOpenTables ? (
              <PosCartIconBtn icon="table-restaurant" accessibilityLabel="الطاولات" onPress={onOpenTables} tone="accent" />
            ) : null}
            {onSaveHoldCart ? (
              <PosCartIconBtn icon="pause-circle-outline" accessibilityLabel="حفظ السلة" onPress={onSaveHoldCart} disabled={cart.length === 0} />
            ) : null}
            {onOpenHoldCarts ? (
              <PosCartIconBtn icon="inventory-2" accessibilityLabel="السلات المحفوظة" onPress={onOpenHoldCarts} />
            ) : null}
            <PosCartIconBtn
              icon="delete-outline"
              accessibilityLabel="مسح السلة"
              onPress={handleClearCart}
              disabled={cart.length === 0}
              tone="danger"
            />
            {showKitchenPrint ? (
              <PosCartIconBtn
                icon="print"
                accessibilityLabel="طباعة للمطبخ"
                onPress={onPrintKitchen!}
                disabled={cart.length === 0}
                tone="accent"
              />
            ) : null}
          </View>
        ) : (
          <View style={styles.actions}>
            <AppButton title="عميل" variant="outline" onPress={onSelectCustomer} style={styles.half} size="sm" />
            <AppButton title="مسح السلة" variant="ghost" onPress={handleClearCart} style={styles.half} size="sm" />
          </View>
        )}
        {!isTablet && showKitchenPrint ? (
          <AppButton
            title="طباعة للمطبخ"
            variant="secondary"
            onPress={onPrintKitchen}
            disabled={cart.length === 0}
            size="sm"
            fullWidth
          />
        ) : null}
        {!isTablet && showCartUtilities ? (
          <>
            {onSaveHoldCart || onOpenHoldCarts ? (
              <View style={styles.actions}>
                {onSaveHoldCart ? (
                  <AppButton title="حفظ السلة" variant="secondary" onPress={onSaveHoldCart} style={styles.half} size="sm" />
                ) : null}
                {onOpenHoldCarts ? (
                  <AppButton title="السلات المحفوظة" variant="outline" onPress={onOpenHoldCarts} style={styles.half} size="sm" />
                ) : null}
              </View>
            ) : null}
            {onCashMovement || onOpenTables ? (
              <View style={styles.actions}>
                {onCashMovement ? (
                  <AppButton title="حركة نقدية" variant="outline" onPress={onCashMovement} style={styles.half} size="sm" />
                ) : null}
                {onOpenTables ? (
                  <AppButton title="الطاولات" variant="secondary" onPress={onOpenTables} style={styles.half} size="sm" />
                ) : null}
              </View>
            ) : null}
          </>
        ) : null}
        <AppButton
          title={`الدفع — ${money(effectiveTotal)}`}
          disabled={cart.length === 0 || !hasShift}
          onPress={onCheckout}
          size="lg"
          fullWidth
        />
      </View>
    </View>
  );
}

function createStyles(c: AppColors, isTablet: boolean) {
  return StyleSheet.create({
    panel: {
      flex: 1,
      backgroundColor: c.surface,
      borderWidth: isTablet ? 0 : 1,
      borderColor: c.borderSubtle,
      borderRadius: isTablet ? 0 : radius.xxl,
      overflow: 'hidden',
      minWidth: 0,
      minHeight: 0,
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingVertical: isTablet ? spacing.md : spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      backgroundColor: isTablet ? c.surfaceMuted : c.surface,
      gap: spacing.sm,
    },
    contextBlock: { gap: spacing.xs },
    statusRow: { ...flexRow, gap: spacing.xs, flexWrap: 'wrap' },
    contextText: { ...textStart, color: c.textMuted, fontSize: typography.tiny, fontFamily: fonts.medium, lineHeight: 18 },
    emptyWrap: { flex: 1, justifyContent: 'center', padding: spacing.lg },
    list: { flex: 1, minHeight: 0 },
    listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
    line: {
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      paddingVertical: isTablet ? spacing.md : spacing.sm,
      gap: spacing.sm,
    },
    lineTop: { ...flexRow, justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
    lineInfo: { gap: 2, flex: 1, minWidth: 0 },
    lineTitle: {
      ...textStart,
      color: c.text,
      fontFamily: fonts.bold,
      fontWeight: '700',
      fontSize: isTablet ? typography.cardTitle : typography.cardTitle,
    },
    lineOption: { ...textStart, color: c.textMuted, fontSize: typography.tiny, fontFamily: fonts.regular },
    lineMeta: { ...textStart, color: c.textMuted, fontSize: typography.small, fontFamily: fonts.medium },
    lineMetaRow: { ...flexRow, alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
    lineDiscount: { ...textStart, color: c.danger, fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700' },
    noteRow: { ...flexRow, gap: spacing.xs, alignItems: 'center' },
    qtyRow: { ...flexRow, gap: spacing.xs, alignItems: 'center', justifyContent: 'space-between' },
    lineTotal: {
      color: c.text,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      fontSize: typography.body,
      writingDirection: 'rtl',
      textAlign: 'left',
      flexShrink: 0,
    },
    qtyBtn: {
      width: isTablet ? 44 : 36,
      height: isTablet ? 44 : 36,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyValue: {
      fontFamily: fonts.bold,
      fontWeight: '700',
      fontSize: isTablet ? typography.sectionTitle : typography.body,
      color: c.text,
      minWidth: 28,
      textAlign: 'center',
    },
    removeBtn: {
      width: isTablet ? 44 : 36,
      height: isTablet ? 44 : 36,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: isTablet ? c.surface : c.surfaceMuted,
    },
    totalsSection: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: isTablet ? c.surfaceMuted : c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    benefitsBox: {
      gap: 3,
      padding: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    benefitsTitle: { ...textStart, color: c.textCaption, fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700' },
    benefitsText: { ...textStart, color: c.text, fontSize: typography.tiny, fontFamily: fonts.medium },
    benefitsHint: { ...textStart, color: c.textMuted, fontSize: typography.tiny, fontFamily: fonts.regular },
    discountText: { ...textStart, color: c.success, fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700' },
    totalRow: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
    summaryRow: { ...flexRow, justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
    summaryLabel: { ...textStart, color: c.textMuted, fontSize: typography.tiny, fontFamily: fonts.medium },
    summaryValue: { color: c.text, fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700', writingDirection: 'rtl' },
    totalLabel: { color: c.textMuted, fontSize: typography.body, fontFamily: fonts.medium, writingDirection: 'rtl' },
    totalValue: {
      color: c.primary,
      fontSize: isTablet ? typography.posTotal : typography.posPrice,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      writingDirection: 'rtl',
    },
    subtotalText: { ...textStart, color: c.textCaption, fontSize: typography.tiny, fontFamily: fonts.regular },
    couponText: { ...textStart, color: c.success, fontSize: typography.small, fontFamily: fonts.bold, fontWeight: '700' },
    customerRow: { ...flexRow, alignItems: 'center', gap: spacing.xs },
    customerText: { ...textStart, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.small },
    walletText: {
      ...textStart,
      color: c.info,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '700',
      paddingHorizontal: spacing.md,
    },
    alertDanger: {
      ...flexRow,
      gap: spacing.sm,
      backgroundColor: c.softDanger,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.md,
      alignItems: 'center',
    },
    alertDangerText: { ...textStart, color: c.danger, fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700', flex: 1 },
    alertWarning: {
      ...flexRow,
      gap: spacing.sm,
      backgroundColor: c.softWarning,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.md,
      alignItems: 'center',
    },
    alertWarningText: { ...textStart, color: '#B45309', fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700', flex: 1 },
    alertInfo: {
      backgroundColor: c.softInfo,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.md,
    },
    alertInfoText: { ...textStart, color: c.info, fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700' },
    actions: { ...flexRow, gap: spacing.sm },
    toolbarRow: { ...flexRow, gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' },
    half: { flex: 1, minWidth: 0 },
  });
}
