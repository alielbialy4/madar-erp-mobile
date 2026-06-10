import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { useColors } from '@/hooks/useColors';
import { getPaymentMethodStyle } from '@/constants/statusColors';
import { flexRow, textStart } from '@/constants/layout';
import { chevronForwardIcon } from '@/utils/rtl';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { dateText, money } from '@/utils/format';
import { paymentTypeIcon, paymentTypeLabel } from '@/utils/paymentLabels';
import { saleStatusBadgeTone, saleStatusLabel } from '@/utils/saleStatus';
import type { Sale } from '@/types/api';
import { Text } from '@/components/ui/AppText';

type Props = {
  sale: Sale;
  onPress?: () => void;
};

function paymentChipStyleKey(type: string | null | undefined): 'cash' | 'instapay' | 'ewallet' | 'visa' | null {
  if (!type?.trim()) return null;
  const key = type.trim().toLowerCase();
  if (key === 'cash') return 'cash';
  if (key === 'instapay') return 'instapay';
  if (['electronic_wallet', 'vodafone_cash', 'wallet'].includes(key)) return 'ewallet';
  if (['card', 'visa'].includes(key)) return 'visa';
  return null;
}

function amount(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function SaleInvoiceCard({ sale, onPress }: Props) {
  const c = useColors();
  const styles = useMemo(() => createCategoryStyles(c), [c]);
  const extra = useMemo(() => createExtraStyles(c), [c]);

  const customer = sale.customer?.name ?? 'عميل نقدي';
  const statusLabel = saleStatusLabel(sale.status);
  const statusTone = saleStatusBadgeTone(sale.status);
  const paymentLabel = paymentTypeLabel(sale.payment_type);
  const paymentIcon = paymentTypeIcon(sale.payment_type);
  const chipKey = paymentChipStyleKey(sale.payment_type);
  const chipStyle = chipKey ? getPaymentMethodStyle(c, chipKey) : null;

  const total = amount(sale.total);
  const paid = amount(sale.paid);
  const hasBalance = paid > 0 && paid + 0.01 < total;

  return (
    <View style={styles.categoryCard}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.cardPressable, pressed && onPress ? { opacity: 0.92 } : undefined]}
      >
        <View style={styles.cardTop}>
          <View style={styles.thumbPlaceholder}>
            <MaterialIcons name="receipt-long" size={28} color={c.accent} />
          </View>

          <View style={styles.cardBody}>
            <View style={extra.titleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {sale.invoice_number || `فاتورة #${sale.id}`}
              </Text>
              <AppBadge label={statusLabel} tone={statusTone} />
            </View>

            <Text style={styles.cardDesc} numberOfLines={1}>
              {customer} • {dateText(sale.created_at)}
            </Text>

            <View style={extra.footerRow}>
              <View
                style={[
                  extra.paymentChip,
                  chipStyle
                    ? { backgroundColor: chipStyle.bg, borderColor: chipStyle.border }
                    : { backgroundColor: c.surfaceMuted, borderColor: c.borderSubtle },
                ]}
              >
                <MaterialIcons
                  name={paymentIcon}
                  size={14}
                  color={chipStyle?.fg ?? c.textMuted}
                />
                <Text
                  style={[extra.paymentChipText, { color: chipStyle?.fg ?? c.textMuted }]}
                  numberOfLines={1}
                >
                  {paymentLabel}
                </Text>
              </View>

              <View style={extra.amountBlock}>
                <Text style={extra.total}>{money(total)}</Text>
                {hasBalance ? (
                  <Text style={extra.paidLine} numberOfLines={1}>
                    مدفوع {money(paid)}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {onPress ? (
            <View style={styles.cardChevron}>
              <MaterialIcons name={chevronForwardIcon()} size={22} color={c.textCaption} />
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

function createExtraStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    titleRow: { ...flexRow, alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
    footerRow: {
      ...flexRow,
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    paymentChip: {
      ...flexRow,
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      flexShrink: 1,
      maxWidth: '58%',
    },
    paymentChipText: {
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      fontWeight: '700',
      writingDirection: 'rtl',
    },
    amountBlock: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
    total: {
      fontSize: typography.cardTitle,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.accent,
      writingDirection: 'rtl',
    },
    paidLine: {
      ...textStart,
      fontSize: 10,
      fontFamily: fonts.medium,
      color: c.textCaption,
      writingDirection: 'rtl',
    },
  });
}
