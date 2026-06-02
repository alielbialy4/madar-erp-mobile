import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui';
import { flexRow, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

type Variant = 'cash' | 'instapay' | 'ewallet';

const variantStyle: Record<Variant, { bg: string; border: string; text: string }> = {
  cash: { bg: '#dcfce7', border: '#86efac', text: '#15803d' },
  instapay: { bg: '#e0f2fe', border: '#7dd3fc', text: '#0369a1' },
  ewallet: { bg: '#ede9fe', border: '#a78bfa', text: '#6d28d9' },
};

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
  const tone = variantStyle[variant];
  return (
    <View
      style={{
        ...flexRow,
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: tone.border,
        backgroundColor: tone.bg,
        ...style,
      }}
    >
      <AppText style={{ ...textStart, fontWeight: '800', color: tone.text, flex: 1 }}>{label}</AppText>
      <AppText style={{ fontWeight: '900', fontSize: typography.h3, color: tone.text }}>{value}</AppText>
    </View>
  );
}
