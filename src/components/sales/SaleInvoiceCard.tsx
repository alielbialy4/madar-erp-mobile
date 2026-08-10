import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { chevronForwardIcon } from '@/utils/rtl';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { dateText, money } from '@/utils/format';
import { paymentTypeIcon, paymentTypeLabel } from '@/utils/paymentLabels';
import { saleStatusBadgeTone, saleStatusLabel } from '@/utils/saleStatus';
import type { Sale } from '@/types/api';

type Props = { sale: Sale; onPress?: () => void };

function amount(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function SaleInvoiceCard({ sale, onPress }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const customer = sale.customer?.name ?? 'عميل نقدي';
  const total = amount(sale.total);
  const paid = amount(sale.paid);
  const remaining = Math.max(0, total - paid);
  const hasBalance = remaining > 0.01;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${sale.invoice_number || `فاتورة ${sale.id}`}، ${money(total)}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? c.surfaceMuted : c.surface, borderColor: c.borderSubtle },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.identityRow}>
          <AppText style={styles.invoice} numberOfLines={1}>
            {sale.invoice_number || `فاتورة #${sale.id}`}
          </AppText>
          <AppBadge label={saleStatusLabel(sale.status)} tone={saleStatusBadgeTone(sale.status)} />
        </View>

        <AppText style={[styles.context, { color: c.textMuted }]} numberOfLines={1}>
          {customer} · {dateText(sale.created_at)}
        </AppText>

        <View style={styles.paymentRow}>
          <View style={styles.paymentMethod}>
            <MaterialIcons name={paymentTypeIcon(sale.payment_type)} size={15} color={c.textMuted} />
            <AppText style={[styles.paymentLabel, { color: c.textMuted }]} numberOfLines={1}>
              {paymentTypeLabel(sale.payment_type)}
            </AppText>
          </View>
          {hasBalance ? (
            <AppText style={[styles.remaining, { color: c.warning }]} numberOfLines={1}>
              متبقي {money(remaining)}
            </AppText>
          ) : (
            <AppText style={[styles.settled, { color: c.success }]} numberOfLines={1}>مسددة</AppText>
          )}
        </View>
      </View>

      <View style={styles.valueColumn}>
        <AppText style={[styles.total, { color: c.text }]} numberOfLines={1}>{money(total)}</AppText>
        {paid > 0 && hasBalance ? (
          <AppText style={[styles.paid, { color: c.textCaption }]} numberOfLines={1}>مدفوع {money(paid)}</AppText>
        ) : null}
      </View>

      {onPress ? <MaterialIcons name={chevronForwardIcon()} size={18} color={c.textCaption} /> : null}
    </Pressable>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: {
      ...flexRow,
      minHeight: 88,
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 0,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    content: { flex: 1, minWidth: 0, gap: 4 },
    identityRow: { ...flexRow, alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
    invoice: {
      ...textLtr,
      color: c.text,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      fontSize: typography.body,
      flexShrink: 1,
    },
    context: { ...textStart, fontFamily: fonts.regular, fontSize: typography.small },
    paymentRow: { ...flexRow, alignItems: 'center', gap: spacing.md },
    paymentMethod: { ...flexRow, alignItems: 'center', gap: spacing.xs },
    paymentLabel: { ...textStart, fontFamily: fonts.medium, fontSize: typography.caption },
    remaining: { ...textStart, fontFamily: fonts.bold, fontSize: typography.caption },
    settled: { ...textStart, fontFamily: fonts.bold, fontSize: typography.caption },
    valueColumn: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
    total: { ...textLtr, fontFamily: fonts.extraBold, fontWeight: '800', fontSize: typography.cardTitle },
    paid: { ...textLtr, fontFamily: fonts.medium, fontSize: typography.micro },
  });
}
