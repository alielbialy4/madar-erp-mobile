import React, { useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui';
import { PosOrderModeToggle } from '@/components/pos/PosOrderModeToggle';
import { AppEmptyState } from '@/components/feedback';
import { flexRow, rtlDirection, textLtr, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { cartLineKey, type CartLine } from '@/store/posStore';
import { cartLineGross } from '@/utils/cartPricing';
import { POS_HOLD_CARTS_ENABLED } from '@/constants/posFeatures';
import { money, numberText } from '@/utils/format';

type Props = {
  cart: CartLine[];
  effectiveTotal: number;
  subtotal: number;
  selectedTableId?: string | null;
  onSelectTakeaway: () => void;
  onSelectDineIn: () => void;
  orderModeDisabled?: boolean;
  shiftError: string | null;
  hasShift: boolean;
  pendingCount: number;
  selectedCustomerName?: string | null;
  selectedTableName?: string | null;
  taxLabel?: string | null;
  serviceChargeLabel?: string | null;
  deliveryFeeLabel?: string | null;
  splitPaid?: number | null;
  splitRemaining?: number | null;
  onSelectCustomer: () => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onSaveHoldCart?: () => void;
  onOpenHoldCarts?: () => void;
  onCashMovement?: () => void;
  onUpdateQty: (lineKey: string, delta: number) => void;
  onRemoveLine: (lineKey: string) => void;
  onPrintKitchen?: () => void;
  kitchenPrintEnabled?: boolean;
  onPrintTableInvoice?: () => void;
  /** Tablet split layout: denser cart chrome, utilities in top bar. */
  variant?: 'default' | 'tablet';
};

function splitFeeLabel(label: string): { name: string; value: string } {
  const idx = label.indexOf(':');
  if (idx === -1) return { name: label, value: '' };
  return { name: label.slice(0, idx).trim(), value: label.slice(idx + 1).trim() };
}

function formatCartLineSummary(item: CartLine): string {
  const parts = [item.product_name];
  if (item.variant_name) parts.push(item.variant_name);
  for (const opt of item.selected_options ?? []) {
    parts.push(`${opt.group_title}: ${opt.options.map((o) => o.name).join(', ')}`);
  }
  if (item.notes) parts.push('ملاحظة');
  return parts.join(' · ');
}

function PosCartIconBtn({
  icon,
  onPress,
  disabled,
  tone = 'default',
  accessibilityLabel,
  size = 'md',
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger' | 'accent';
  accessibilityLabel: string;
  size?: 'md' | 'lg';
}) {
  const c = useColors();
  const dim = size === 'lg' ? 44 : 40;
  const iconSize = size === 'lg' ? 22 : 20;
  const bg = tone === 'danger' ? c.softDanger : tone === 'accent' ? c.accentSoft : c.surfaceMuted;
  const border = tone === 'danger' ? c.softDangerBorder : tone === 'accent' ? c.accentBorder : c.borderSubtle;
  const iconColor = tone === 'danger' ? c.danger : tone === 'accent' ? c.accent : c.text;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          width: dim,
          height: dim,
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
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
      <MaterialIcons name={icon} size={iconSize} color={iconColor} />
    </Pressable>
  );
}

export function PosOrderPanel({
  cart,
  effectiveTotal,
  subtotal,
  selectedTableId,
  onSelectTakeaway,
  onSelectDineIn,
  orderModeDisabled,
  shiftError,
  hasShift,
  pendingCount,
  selectedCustomerName,
  selectedTableName,
  taxLabel,
  serviceChargeLabel,
  deliveryFeeLabel,
  splitPaid,
  splitRemaining,
  onSelectCustomer,
  onClearCart,
  onCheckout,
  onSaveHoldCart,
  onOpenHoldCarts,
  onCashMovement,
  onUpdateQty,
  onRemoveLine,
  onPrintKitchen,
  kitchenPrintEnabled = false,
  onPrintTableInvoice,
  variant = 'default',
}: Props) {
  const isTablet = variant === 'tablet';
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const c = useColors();
  const styles = useMemo(() => createStyles(c, isTablet), [c, isTablet]);

  const showKitchenPrint = Boolean(onPrintKitchen) && kitchenPrintEnabled;
  const showTableInvoice = Boolean(onPrintTableInvoice) && Boolean(selectedTableId);
  const isDineIn = Boolean(selectedTableId);

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
        <View style={styles.headerTop}>
          <View style={styles.headerIconWrap}>
            <MaterialIcons name="receipt-long" size={22} color={c.primary} />
          </View>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>الطلب الحالي</Text>
            <Text style={styles.headerSubtitle}>
              {itemCount > 0 ? `${numberText(itemCount)} صنف في السلة` : 'لا توجد أصناف بعد'}
            </Text>
          </View>
          <View style={styles.itemCountPill}>
            <MaterialIcons name="shopping-cart" size={16} color={c.primary} />
            <Text style={styles.itemCountText}>{numberText(itemCount)}</Text>
          </View>
        </View>
        {selectedCustomerName ? (
          <View style={styles.customerChip}>
            <MaterialIcons name="person" size={16} color={c.textMuted} />
            <Text style={styles.customerName} numberOfLines={1}>
              {selectedCustomerName}
            </Text>
          </View>
        ) : null}
        <PosOrderModeToggle
          isDineIn={isDineIn}
          dineInLabel={selectedTableName}
          onSelectTakeaway={onSelectTakeaway}
          onSelectDineIn={onSelectDineIn}
          disabled={orderModeDisabled}
        />
      </View>

      {shiftError ? (
        <View style={styles.alertDanger}>
          <MaterialIcons name="error-outline" size={16} color={c.danger} />
          <Text style={styles.alertDangerText}>{shiftError}</Text>
        </View>
      ) : null}
      {pendingCount > 0 ? (
        <View style={styles.alertInfo}>
          <Text style={styles.alertInfoText}>طلبات محلية معلقة: {numberText(pendingCount)}</Text>
        </View>
      ) : null}

      {cart.length === 0 ? (
        <View style={styles.emptyWrap}>
          <AppEmptyState
            title="السلة فارغة"
            message={isTablet ? 'اختر منتجات من الكتالوج على اليمين.' : 'اختر منتجات من الكتالوج.'}
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
            const lineTotal = cartLineGross(item);
            return (
              <View style={styles.line}>
                <View style={styles.lineRow}>
                  <View style={styles.lineLeading}>
                    <Text style={styles.lineSummary} numberOfLines={1} ellipsizeMode="tail">
                      {formatCartLineSummary(item)}
                      {item.discount > 0 ? ` · -${money(item.discount)}` : ''}
                    </Text>
                  </View>
                  <View style={styles.qtyGroup}>
                    <Pressable onPress={() => onUpdateQty(key, -1)} style={styles.qtyBtn} hitSlop={4}>
                      <MaterialIcons name="remove" size={16} color={c.textMuted} />
                    </Pressable>
                    <Text style={styles.qtyValue}>{numberText(item.quantity)}</Text>
                    <Pressable onPress={() => onUpdateQty(key, 1)} style={styles.qtyBtn} hitSlop={4}>
                      <MaterialIcons name="add" size={16} color={c.accent} />
                    </Pressable>
                  </View>
                  <Text style={styles.lineTotal}>{money(lineTotal)}</Text>
                  <Pressable
                    onPress={() => onRemoveLine(key)}
                    style={styles.removeBtn}
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel="حذف من السلة"
                  >
                    <MaterialIcons name="delete-outline" size={18} color={c.danger} />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <View style={styles.totalsSection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>المجموع الفرعي</Text>
            <Text style={styles.summaryValue}>{money(subtotal)}</Text>
          </View>
          {taxLabel ? (() => {
            const fee = splitFeeLabel(taxLabel);
            return (
              <View style={styles.summaryRow}>
                <Text style={styles.feeLabel}>{fee.name}</Text>
                <Text style={styles.feeValue}>{fee.value}</Text>
              </View>
            );
          })() : null}
          {serviceChargeLabel ? (() => {
            const fee = splitFeeLabel(serviceChargeLabel);
            return (
              <View style={styles.summaryRow}>
                <Text style={styles.feeLabel}>{fee.name}</Text>
                <Text style={styles.feeValue}>{fee.value}</Text>
              </View>
            );
          })() : null}
          {deliveryFeeLabel ? (() => {
            const fee = splitFeeLabel(deliveryFeeLabel);
            return (
              <View style={styles.summaryRow}>
                <Text style={styles.feeLabel}>{fee.name}</Text>
                <Text style={styles.feeValue}>{fee.value}</Text>
              </View>
            );
          })() : null}
          {splitPaid != null ? (
            <View style={styles.summaryRow}>
              <Text style={styles.feeLabel}>المدفوع</Text>
              <Text style={styles.feeValue}>{money(splitPaid)}</Text>
            </View>
          ) : null}
          {splitRemaining != null ? (
            <View style={styles.summaryRow}>
              <Text style={styles.feeLabel}>المتبقي</Text>
              <Text style={styles.feeValue}>{money(splitRemaining)}</Text>
            </View>
          ) : null}
          <View style={styles.totalHighlight}>
            <Text style={styles.totalLabel}>الإجمالي</Text>
            <Text style={styles.totalValue}>{money(effectiveTotal)}</Text>
          </View>
        </View>
        <View style={styles.checkoutRow}>
          <AppButton
            title={`الدفع — ${money(effectiveTotal)}`}
            disabled={cart.length === 0 || !hasShift}
            onPress={onCheckout}
            size="xl"
            style={styles.checkoutBtn}
          />
          <View style={styles.checkoutIcons}>
            <PosCartIconBtn size="lg" icon="person-outline" accessibilityLabel="اختيار عميل" onPress={onSelectCustomer} />
            {POS_HOLD_CARTS_ENABLED && onOpenHoldCarts ? (
              <PosCartIconBtn
                size="lg"
                icon="inventory-2"
                accessibilityLabel="السلات المحفوظة"
                onPress={onOpenHoldCarts}
              />
            ) : null}
            {POS_HOLD_CARTS_ENABLED && onSaveHoldCart ? (
              <PosCartIconBtn
                size="lg"
                icon="pause-circle-outline"
                accessibilityLabel="حفظ السلة"
                onPress={onSaveHoldCart}
                disabled={cart.length === 0}
              />
            ) : null}
            <PosCartIconBtn
              size="lg"
              icon="delete-outline"
              accessibilityLabel="مسح السلة"
              onPress={handleClearCart}
              disabled={cart.length === 0}
              tone="danger"
            />
            {showTableInvoice ? (
              <PosCartIconBtn
                size="lg"
                icon="receipt"
                accessibilityLabel="طباعة فاتورة الطاولة"
                onPress={onPrintTableInvoice!}
                disabled={cart.length === 0}
                tone="accent"
              />
            ) : null}
            {showKitchenPrint ? (
              <PosCartIconBtn
                size="lg"
                icon="print"
                accessibilityLabel="طباعة للمطبخ"
                onPress={onPrintKitchen!}
                disabled={cart.length === 0}
                tone="accent"
              />
            ) : onCashMovement ? (
              <PosCartIconBtn size="lg" icon="payments" accessibilityLabel="حركة نقدية" onPress={onCashMovement} tone="accent" />
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(c: AppColors, isTablet: boolean) {
  return StyleSheet.create({
    panel: {
      flex: 1,
      backgroundColor: c.surface,
      borderWidth: 0,
      borderRadius: 0,
      minWidth: 0,
      minHeight: 0,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
      gap: spacing.sm,
    },
    headerTop: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    headerTitle: {
      ...textStart,
      color: c.text,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      ...textStart,
      color: c.textCaption,
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      fontWeight: '500',
    },
    itemCountPill: {
      ...flexRow,
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.md,
      backgroundColor: c.softPrimary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.softPrimaryBorder,
    },
    itemCountText: {
      color: c.primary,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      fontSize: typography.small,
      writingDirection: 'rtl',
    },
    customerChip: {
      ...flexRow,
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.xs,
      maxWidth: '100%',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
    },
    customerName: {
      ...textStart,
      color: c.text,
      fontFamily: fonts.bold,
      fontWeight: '700',
      fontSize: typography.small,
      flexShrink: 1,
    },
    emptyWrap: { flex: 1, justifyContent: 'center', padding: spacing.lg },
    list: { flex: 1, minHeight: 0 },
    listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
    line: {
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      paddingVertical: isTablet ? spacing.sm : spacing.xs,
    },
    lineRow: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 36,
    },
    lineLeading: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
    },
    lineSummary: {
      ...textStart,
      color: c.text,
      fontFamily: fonts.medium,
      fontSize: typography.small,
    },
    qtyGroup: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      flexShrink: 0,
      paddingHorizontal: spacing.xs,
    },
    lineTotal: {
      ...textLtr,
      color: c.text,
      fontFamily: fonts.bold,
      fontWeight: '700',
      fontSize: typography.small,
      flexShrink: 0,
      marginStart: spacing.xs,
    },
    qtyBtn: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyValue: {
      fontFamily: fonts.bold,
      fontWeight: '700',
      fontSize: typography.label,
      color: c.text,
      minWidth: 22,
      textAlign: 'center',
    },
    removeBtn: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: c.surface,
    },
    totalsSection: {
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      backgroundColor: c.surface,
    },
    summaryRow: {
      ...flexRow,
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 24,
    },
    summaryLabel: {
      ...textStart,
      color: c.textMuted,
      fontSize: typography.small,
      fontFamily: fonts.medium,
      fontWeight: '500',
    },
    summaryValue: {
      color: c.text,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      fontWeight: '700',
      writingDirection: 'rtl',
    },
    feeLabel: {
      ...textStart,
      color: c.textCaption,
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      fontWeight: '500',
    },
    feeValue: {
      color: c.textMuted,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '700',
      writingDirection: 'rtl',
    },
    totalHighlight: {
      ...flexRow,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
      paddingTop: spacing.md,
      paddingHorizontal: 0,
      paddingBottom: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    totalLabel: {
      color: c.primary,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      fontWeight: '700',
      writingDirection: 'rtl',
    },
    totalValue: {
      color: c.primary,
      fontSize: isTablet ? typography.posTotal : typography.sectionTitle,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      writingDirection: 'rtl',
      letterSpacing: -0.4,
    },
    alertDanger: {
      ...flexRow,
      gap: spacing.sm,
      backgroundColor: c.softDanger,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.md,
      alignItems: 'center',
    },
    alertDangerText: { ...textStart, color: c.danger, fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700', flex: 1 },
    alertInfo: {
      backgroundColor: c.softInfo,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.md,
    },
    alertInfoText: { ...textStart, color: c.info, fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700' },
    checkoutRow: {
      ...flexRow,
      alignItems: 'stretch',
      gap: spacing.sm,
    },
    checkoutBtn: {
      flex: 1,
      minWidth: 0,
      borderRadius: radius.md,
    },
    checkoutIcons: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      flexShrink: 0,
    },
  });
}
