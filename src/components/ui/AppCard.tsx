import React, { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

type Props = PropsWithChildren<{
  style?: ViewStyle;
  padded?: boolean;
  hoverable?: boolean;
}>;

export function AppCard({ children, style, padded = true, hoverable }: Props) {
  return <View style={[styles.card, padded ? styles.padded : undefined, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  padded: { padding: spacing.cardPadding },
});
