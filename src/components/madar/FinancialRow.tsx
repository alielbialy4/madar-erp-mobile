import React from 'react';
import { DenseRow, type DenseRowProps } from './DenseRow';
import { FinancialValue } from './FinancialValue';
import { rowHeight } from '@/constants/spacing';

type Props = Omit<DenseRowProps, 'trailing' | 'height'> & {
  amount: string | number;
  currency?: string;
  amountTone?: 'default' | 'positive' | 'negative' | 'muted';
  amountPrefix?: string;
};

export function FinancialRow({ amount, currency, amountTone = 'default', amountPrefix, ...rest }: Props) {
  return (
    <DenseRow
      {...rest}
      height={rowHeight.financial}
      trailing={
        <FinancialValue
          amount={amount}
          currency={currency}
          level="inline"
          tone={amountTone}
          prefix={amountPrefix}
        />
      }
    />
  );
}
