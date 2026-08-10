import React from 'react';
import { View } from 'react-native';
import { AppBadge } from '@/components/ui';
import { AppText } from '@/components/ui/AppText';
import { FinancialValue } from '@/components/madar';
import { OperationalRow } from '@/components/madar/OperationalRow';
import { useColors } from '@/hooks/useColors';
import { textStyle } from '@/constants/textStyles';
import { dateText, money } from '@/utils/format';
import { paymentTypeLabel } from '@/utils/paymentLabels';
import { saleStatusBadgeTone, saleStatusLabel } from '@/utils/saleStatus';
import type { Sale } from '@/types/api';

type Props = { sale: Sale; onPress?: () => void; selected?: boolean };

function amount(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

/** Dense sales index row — Stripe/Linear scanning density. */
export function SaleInvoiceCard({ sale, onPress, selected }: Props) {
  const c = useColors();
  const customer = sale.customer?.name ?? 'عميل نقدي';
  const total = amount(sale.total);
  const paid = amount(sale.paid);
  const remaining = Math.max(0, total - paid);
  const hasBalance = remaining > 0.01;
  const invoice = sale.invoice_number || `فاتورة #${sale.id}`;

  return (
    <OperationalRow
      primary={invoice}
      secondary={`${customer} · ${dateText(sale.created_at)}`}
      meta={`${paymentTypeLabel(sale.payment_type)}${hasBalance ? ` · متبقي ${money(remaining)}` : ' · مسددة'}`}
      statusLabel={saleStatusLabel(sale.status)}
      statusTone={saleStatusBadgeTone(sale.status)}
      amount={total}
      currency="ج.م"
      onPress={onPress}
      selected={selected}
    />
  );
}

/** Compact trailing block used when OperationalRow is not a fit */
export function SaleAmountBlock({ total, paid, hasBalance }: { total: number; paid: number; hasBalance: boolean }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'flex-end', gap: 2 }}>
      <FinancialValue amount={total} currency="ج.م" level="inline" />
      {paid > 0 && hasBalance ? (
        <AppText style={[textStyle('metadata'), { color: c.textCaption }]} numeric translate={false}>
          {money(paid)}
        </AppText>
      ) : null}
      {!hasBalance ? <AppBadge label="مسددة" tone="success" /> : null}
    </View>
  );
}
