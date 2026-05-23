import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { chevronForwardIcon } from '@/utils/rtl';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { dateText, money } from '@/utils/format';
import type { Sale } from '@/types/api';
import { Text } from '@/components/ui/AppText';

type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

type Props = {
  sale: Sale;
  badge?: { label: string; tone?: BadgeTone };
  onPress?: () => void;
};

export function SaleInvoiceCard({ sale, badge, onPress }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const customer = sale.customer?.name ?? 'عميل نقدي';
  const payment = sale.payment_type ?? '—';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.cardPressed : undefined]}
    >
      <View style={styles.topRow}>
        <View style={styles.invoiceIcon}>
          <MaterialIcons name="receipt-long" size={22} color={c.accent} />
        </View>
        <View style={styles.headBody}>
          <Text style={styles.invoiceNo} numberOfLines={1}>
            {sale.invoice_number || `فاتورة #${sale.id}`}
          </Text>
          <Text style={styles.dateLine} numberOfLines={1}>
            {dateText(sale.created_at)}
          </Text>
        </View>
        {badge ? <AppBadge label={badge.label} tone={badge.tone} /> : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>العميل</Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {customer}
          </Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>الدفع</Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {payment}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.total}>{money(sale.total ?? 0)}</Text>
        <MaterialIcons name={chevronForwardIcon()} size={22} color={c.textCaption} />
      </View>
    </Pressable>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.lg,
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    cardPressed: { backgroundColor: c.surfaceMuted, borderColor: c.accentBorder },
    topRow: { ...flexRow, alignItems: 'flex-start', gap: spacing.md },
    invoiceIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.xl,
      backgroundColor: c.softPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headBody: { flex: 1, minWidth: 0, gap: 2 },
    invoiceNo: {
      ...textStart,
      fontSize: typography.cardTitle,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
    },
    dateLine: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
    metaRow: { ...flexRow, gap: spacing.md },
    metaBlock: { flex: 1, gap: 2 },
    metaLabel: {
      ...textStart,
      fontSize: 10,
      fontFamily: fonts.medium,
      color: c.textCaption,
    },
    metaValue: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      color: c.text,
    },
    footer: { ...flexRow, alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: c.borderSubtle },
    total: {
      fontSize: typography.pageTitle,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.accent,
      writingDirection: 'rtl',
    },
  });
}
