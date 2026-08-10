import React from 'react';
import { View } from 'react-native';
import { DenseRow, type DenseRowProps } from './DenseRow';
import { AppBadge } from '@/components/ui/AppBadge';
import { FinancialValue } from './FinancialValue';
import { rowHeight } from '@/constants/spacing';
import type { ComponentProps } from 'react';

type BadgeTone = NonNullable<ComponentProps<typeof AppBadge>['tone']>;

type Props = Omit<DenseRowProps, 'trailing' | 'height' | 'status'> & {
  statusLabel?: string;
  statusTone?: BadgeTone;
  amount?: string | number;
  currency?: string;
  elapsed?: string;
};

/** Delivery / sales / KDS-style operational rows */
export function OperationalRow({
  statusLabel,
  statusTone = 'default',
  amount,
  currency,
  elapsed,
  meta,
  ...rest
}: Props) {
  return (
    <DenseRow
      {...rest}
      height={rowHeight.operational}
      meta={meta ?? elapsed}
      status={statusLabel ? <AppBadge label={statusLabel} tone={statusTone} /> : undefined}
      trailing={
        amount != null ? (
          <View>
            <FinancialValue amount={amount} currency={currency} level="inline" />
          </View>
        ) : undefined
      }
    />
  );
}
