import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { ComponentProps } from 'react';
import { DenseRow, type DenseRowProps } from './DenseRow';
import { FinancialValue } from './FinancialValue';
import { AppBadge } from '@/components/ui/AppBadge';
import { useColors } from '@/hooks/useColors';
import { radius, rowHeight } from '@/constants/spacing';

type Props = Omit<DenseRowProps, 'trailing' | 'height' | 'leading'> & {
  imageUri?: string | null;
  fallback?: React.ReactNode;
  amount?: string | number;
  currency?: string;
  badgeLabel?: string;
  badgeTone?: NonNullable<ComponentProps<typeof AppBadge>['tone']>;
};

export function EntityRow({
  imageUri,
  fallback,
  amount,
  currency,
  badgeLabel,
  badgeTone,
  status,
  ...rest
}: Props) {
  const c = useColors();
  const leading = imageUri ? (
    <Image source={{ uri: imageUri }} style={styles.image} />
  ) : fallback ? (
    <View style={[styles.image, { backgroundColor: c.surfaceMuted, alignItems: 'center', justifyContent: 'center' }]}>
      {fallback}
    </View>
  ) : undefined;

  return (
    <DenseRow
      {...rest}
      height={rowHeight.entity}
      leading={leading}
      status={status ?? (badgeLabel ? <AppBadge label={badgeLabel} tone={badgeTone} /> : undefined)}
      trailing={
        amount != null ? (
          <FinancialValue amount={amount} currency={currency} level="inline" />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
  },
});
