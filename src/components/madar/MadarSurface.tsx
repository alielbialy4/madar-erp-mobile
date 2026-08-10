import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';

type Props = {
  children: React.ReactNode;
  elevated?: boolean;
  padded?: boolean;
  bordered?: boolean;
  style?: ViewStyle;
};

/** Subtle mass for genuine grouping — prefer MadarSection first. */
export function MadarSurface({ children, elevated, padded = true, bordered = true, style }: Props) {
  const c = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: elevated ? c.surfaceMuted : c.surface,
          borderRadius: radius.surface,
          borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
          borderColor: c.borderSubtle,
          padding: padded ? spacing.lg : 0,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
