import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'warning';
type Size = 'default' | 'sm' | 'lg' | 'xl';

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
  fullWidth?: boolean;
};

const shadowPrimary = Platform.select({
  ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  android: { elevation: 2 },
  default: {},
});

const shadowDanger = Platform.select({
  ios: { shadowColor: colors.danger, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  android: { elevation: 2 },
  default: {},
});

export function AppButton({ title, onPress, disabled, loading, variant = 'primary', size = 'default', style, fullWidth }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        pressed && !isDisabled ? styles.pressed : undefined,
        isDisabled ? styles.disabled : undefined,
        fullWidth ? styles.fullWidth : undefined,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isLightVariant(variant) ? colors.accent : colors.primaryForeground}
        />
      ) : (
        <Text style={[styles.text, textColorStyles[variant]]}>{title}</Text>
      )}
    </Pressable>
  );
}

function isLightVariant(v: Variant) {
  return v === 'secondary' || v === 'outline' || v === 'ghost';
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  fullWidth: { width: '100%' },
  text: { fontSize: typography.body, fontFamily: fonts.bold, fontWeight: '700' },
});

const sizeStyles = StyleSheet.create({
  default: { minHeight: 40 },
  sm: { minHeight: 36, paddingHorizontal: spacing.md },
  lg: { minHeight: 44, paddingHorizontal: spacing.xl },
  xl: { minHeight: 48, paddingHorizontal: spacing.xxl },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary, borderColor: colors.primary, ...shadowPrimary },
  secondary: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
  outline: { backgroundColor: colors.surface, borderColor: colors.border },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger, ...shadowDanger },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  success: { backgroundColor: colors.success, borderColor: colors.success },
  warning: { backgroundColor: colors.warning, borderColor: colors.warning },
});

const textColorStyles = StyleSheet.create({
  primary: { color: colors.primaryForeground },
  secondary: { color: colors.text },
  outline: { color: colors.text },
  danger: { color: colors.primaryForeground },
  ghost: { color: colors.accent },
  success: { color: colors.primaryForeground },
  warning: { color: colors.primaryForeground },
});
