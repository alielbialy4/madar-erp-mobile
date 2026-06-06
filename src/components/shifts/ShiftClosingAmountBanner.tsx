import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { getPaymentMethodStyle } from '@/constants/statusColors';
import { useColors } from '@/hooks/useColors';

type Variant = 'cash' | 'instapay' | 'ewallet';

export function ShiftClosingAmountBanner({
  label,
  value,
  variant,
  style,
}: {
  label: string;
  value: string;
  variant: Variant;
  style?: ViewStyle;
}) {
  const c = useColors();
  const tone = getPaymentMethodStyle(c, variant);
  return (
    <View
      style={{
        ...flexRow,
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: tone.border,
        backgroundColor: tone.bg,
        ...style,
      }}
    >
      <AppText style={{ ...textStart, fontWeight: '800', color: tone.fg, flex: 1 }}>{label}</AppText>
      <AppText style={{ fontWeight: '900', fontSize: typography.h3, color: tone.fg }}>{value}</AppText>
    </View>
  );
}
