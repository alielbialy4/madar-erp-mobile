import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui';
import { flexRow, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';

type Variant = 'cash' | 'instapay' | 'ewallet';

/** Neutral closing summary row — method identity via label, not rainbow wells. */
export function ShiftClosingAmountBanner({
  label,
  value,
  variant: _variant,
  style,
}: {
  label: string;
  value: string;
  variant: Variant;
  style?: ViewStyle;
}) {
  const c = useColors();
  return (
    <View
      style={[
        {
          ...flexRow,
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: spacing.sm,
          paddingVertical: spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.borderSubtle,
        },
        style,
      ]}
    >
      <AppText
        style={{
          ...textStart,
          fontFamily: fonts.medium,
          fontWeight: '600',
          color: c.textMuted,
          flex: 1,
          fontSize: typography.rowSecondary,
        }}
      >
        {label}
      </AppText>
      <AppText
        style={{
          fontFamily: fonts.bold,
          fontWeight: '700',
          fontSize: typography.rowPrimary,
          color: c.text,
        }}
      >
        {value}
      </AppText>
    </View>
  );
}
