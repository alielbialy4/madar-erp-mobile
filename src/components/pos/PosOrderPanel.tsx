import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBadge, AppButton, AppSectionHeader } from '@/components/ui';
import { AppEmptyState } from '@/components/feedback';
import { flexRow, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { cartLineKey, type CartLine } from '@/store/posStore';
import { money, numberText } from '@/utils/format';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type Props = {
  cart: CartLine[];
  effectiveTotal: number;
  subtotal: number;
  shiftError: string | null;
  hasShift: boolean;
  pendingCount: number;
  selectedCustomerName?: string | null;
  walletText?: string | null;
  couponLabel?: string | null;
  onSelectCustomer: () => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onSaveHoldCart?: () => void;
  onOpenHoldCarts?: () => void;
  onCashMovement?: () => void;
  onOpenTables?: () => void;
  onUpdateQty: (lineKey: string, delta: number) => void;
  onRemoveLine: (lineKey: string) => void;
};

export function PosOrderPanel({
  cart,
  effectiveTotal,
  subtotal,
  shiftError,
  hasShift,
  pendingCount,
  selectedCustomerName,
  walletText,
  couponLabel,
  onSelectCustomer,
  onClearCart,
  onCheckout,
  onSaveHoldCart,
  onOpenHoldCarts,
  onCashMovement,
  onOpenTables,
  onUpdateQty,
  onRemoveLine,
}: Props) {
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <AppSectionHeader title="الطلب" action={<AppBadge label={`${numberText(itemCount)} صنف`} tone="info" />} />
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
        <AppEmptyState title="السلة فارغة" message="اختر منتجات من الكتالوج." />
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item, i) => `${cartLineKey(item)}-${i}`}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const key = cartLineKey(item);
            return (
            <View style={styles.line}>
              <View style={styles.lineInfo}>
                <Text style={styles.lineTitle}>{item.product_name}</Text>
                {item.variant_name ? <Text style={styles.lineOption}>الاختيار: {item.variant_name}</Text> : null}
                {item.selected_options?.map((opt, j) => (
                  <Text key={j} style={styles.lineOption}>
                    {opt.group_title}: {opt.options.map((o) => o.name).join(', ')}
                  </Text>
                ))}
                <Text style={styles.lineMeta}>{money(item.unit_price)} × {numberText(item.quantity)}</Text>
              </View>
              <View style={styles.qtyRow}>
                <Pressable onPress={() => onUpdateQty(key, 1)} style={styles.qtyBtn}>
                  <MaterialIcons name="add" size={18} color={c.accent} />
                </Pressable>
                <Text style={styles.qtyValue}>{numberText(item.quantity)}</Text>
                <Pressable onPress={() => onUpdateQty(key, -1)} style={styles.qtyBtn}>
                  <MaterialIcons name="remove" size={18} color={c.textMuted} />
                </Pressable>
                <Pressable onPress={() => onRemoveLine(key)} style={styles.removeBtn}>
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
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>الإجمالي</Text>
            <Text style={styles.totalValue}>{money(effectiveTotal)}</Text>
          </View>
          {couponLabel ? <Text style={styles.couponText}>{couponLabel}</Text> : null}
          {subtotal !== effectiveTotal ? (
            <Text style={styles.subtotalText}>قبل الخصم: {money(subtotal)}</Text>
          ) : null}
        </View>
        {selectedCustomerName ? (
          <View style={styles.customerRow}>
            <MaterialIcons name="person" size={14} color={c.textMuted} />
            <Text style={styles.customerText}>{selectedCustomerName}</Text>
          </View>
        ) : null}
        <View style={styles.actions}>
          <AppButton title="عميل" variant="outline" onPress={onSelectCustomer} style={styles.half} size="sm" />
          <AppButton title="مسح" variant="ghost" onPress={onClearCart} style={styles.half} size="sm" />
        </View>
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    panel: {
      flex: 1,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      borderRadius: radius.xxl,
      overflow: 'hidden',
      minWidth: 0,
    },
    header: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: c.borderSubtle },
    list: { flex: 1 },
    listContent: { paddingHorizontal: spacing.md },
    line: { borderBottomWidth: 1, borderBottomColor: c.borderSubtle, paddingVertical: spacing.sm, gap: spacing.sm },
    lineInfo: { gap: 2 },
    lineTitle: { ...textStart, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.cardTitle },
    lineOption: { ...textStart, color: c.textMuted, fontSize: typography.tiny, fontFamily: fonts.regular },
    lineMeta: { ...textStart, color: c.textMuted, fontSize: typography.small, fontFamily: fonts.medium },
    qtyRow: { ...flexRow, gap: spacing.sm, alignItems: 'center' },
    qtyBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyValue: {
      fontFamily: fonts.bold,
      fontWeight: '700',
      fontSize: typography.body,
      color: c.text,
      minWidth: 24,
      textAlign: 'center',
    },
    removeBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: c.surfaceMuted,
    },
    totalsSection: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    totalRow: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { color: c.textMuted, fontSize: typography.body, fontFamily: fonts.medium, writingDirection: 'rtl' },
    totalValue: { color: c.primary, fontSize: typography.posPrice, fontFamily: fonts.extraBold, fontWeight: '800', writingDirection: 'rtl' },
    subtotalText: { ...textStart, color: c.textCaption, fontSize: typography.tiny, fontFamily: fonts.regular },
    couponText: { ...textStart, color: c.success, fontSize: typography.small, fontFamily: fonts.bold, fontWeight: '700' },
    customerRow: { ...flexRow, alignItems: 'center', gap: spacing.xs },
    customerText: { ...textStart, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.small },
    walletText: { ...textStart, color: c.info, fontSize: typography.small, fontFamily: fonts.bold, fontWeight: '700', paddingHorizontal: spacing.md },
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
    half: { flex: 1 },
  });
}
