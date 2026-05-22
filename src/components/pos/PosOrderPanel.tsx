import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBadge, AppButton, AppSectionHeader } from '@/components/ui';
import { AppEmptyState } from '@/components/feedback';
import { flexRow, textStart } from '@/constants/layout';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import type { CartLine } from '@/store/posStore';
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
  onUpdateQty: (productId: number, delta: number) => void;
  onRemoveLine: (productId: number) => void;
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
  onUpdateQty,
  onRemoveLine,
}: Props) {
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <AppSectionHeader title="الطلب" action={<AppBadge label={`${numberText(itemCount)} صنف`} tone="info" />} />
      </View>

      {shiftError ? (
        <View style={styles.alertDanger}>
          <MaterialIcons name="error-outline" size={16} color={colors.danger} />
          <Text style={styles.alertDangerText}>{shiftError}</Text>
        </View>
      ) : null}
      {!hasShift ? (
        <View style={styles.alertWarning}>
          <MaterialIcons name="warning" size={16} color={colors.warning} />
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
          keyExtractor={(item, i) => `${item.product_id}-${i}`}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.line}>
              <View style={styles.lineInfo}>
                <Text style={styles.lineTitle}>{item.product_name}</Text>
                {item.selected_options?.map((opt, j) => (
                  <Text key={j} style={styles.lineOption}>
                    {opt.group_title}: {opt.options.map((o) => o.name).join(', ')}
                  </Text>
                ))}
                <Text style={styles.lineMeta}>{money(item.unit_price)} × {numberText(item.quantity)}</Text>
              </View>
              <View style={styles.qtyRow}>
                <Pressable onPress={() => onUpdateQty(item.product_id, 1)} style={styles.qtyBtn}>
                  <MaterialIcons name="add" size={18} color={colors.accent} />
                </Pressable>
                <Text style={styles.qtyValue}>{numberText(item.quantity)}</Text>
                <Pressable onPress={() => onUpdateQty(item.product_id, -1)} style={styles.qtyBtn}>
                  <MaterialIcons name="remove" size={18} color={colors.textMuted} />
                </Pressable>
                <Pressable onPress={() => onRemoveLine(item.product_id)} style={styles.removeBtn}>
                  <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          )}
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
            <MaterialIcons name="person" size={14} color={colors.textMuted} />
            <Text style={styles.customerText}>{selectedCustomerName}</Text>
          </View>
        ) : null}
        <View style={styles.actions}>
          <AppButton title="عميل" variant="outline" onPress={onSelectCustomer} style={styles.half} size="sm" />
          <AppButton title="مسح" variant="ghost" onPress={onClearCart} style={styles.half} size="sm" />
        </View>
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

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    minWidth: 0,
  },
  header: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.md },
  line: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle, paddingVertical: spacing.sm, gap: spacing.sm },
  lineInfo: { gap: 2 },
  lineTitle: { ...textStart, color: colors.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.cardTitle },
  lineOption: { ...textStart, color: colors.textMuted, fontSize: typography.tiny, fontFamily: fonts.regular },
  lineMeta: { ...textStart, color: colors.textMuted, fontSize: typography.small, fontFamily: fonts.medium },
  qtyRow: { ...flexRow, gap: spacing.sm, alignItems: 'center' },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontFamily: fonts.bold,
    fontWeight: '700',
    fontSize: typography.body,
    color: colors.text,
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
    borderTopColor: colors.borderSubtle,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  totalsSection: { gap: spacing.xs },
  totalRow: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: colors.textMuted, fontSize: typography.body, fontFamily: fonts.medium },
  totalValue: { color: colors.text, fontSize: typography.posPrice, fontFamily: fonts.extraBold, fontWeight: '800' },
  subtotalText: { ...textStart, color: colors.textCaption, fontSize: typography.tiny, fontFamily: fonts.regular },
  couponText: { ...textStart, color: colors.success, fontSize: typography.small, fontFamily: fonts.bold, fontWeight: '700' },
  customerRow: { ...flexRow, alignItems: 'center', gap: spacing.xs },
  customerText: { ...textStart, color: colors.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.small },
  walletText: { ...textStart, color: colors.info, fontSize: typography.small, fontFamily: fonts.bold, fontWeight: '700', paddingHorizontal: spacing.md },
  alertDanger: {
    ...flexRow,
    gap: spacing.sm,
    backgroundColor: colors.softDanger,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    alignItems: 'center',
  },
  alertDangerText: { ...textStart, color: colors.danger, fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700', flex: 1 },
  alertWarning: {
    ...flexRow,
    gap: spacing.sm,
    backgroundColor: colors.softWarning,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    alignItems: 'center',
  },
  alertWarningText: { ...textStart, color: '#B45309', fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700', flex: 1 },
  alertInfo: {
    backgroundColor: colors.softInfo,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
  },
  alertInfoText: { ...textStart, color: colors.info, fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700' },
  actions: { ...flexRow, gap: spacing.sm },
  half: { flex: 1 },
});
