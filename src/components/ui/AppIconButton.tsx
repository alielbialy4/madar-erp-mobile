import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/spacing';
import { pressScale } from '@/utils/animations';

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  size?: number;
  color?: string;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function AppIconButton({
  icon,
  onPress,
  disabled,
  size = 22,
  color,
  variant = 'default',
  accessibilityLabel,
  style,
}: Props) {
  const iconColor = color ?? (variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : colors.text);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !disabled ? [styles.pressed, pressScale(true)] : undefined,
        disabled ? styles.disabled : undefined,
        style,
      ]}
    >
      <MaterialIcons name={icon} size={size} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  disabled: { opacity: 0.45 },
});

const variantStyles = StyleSheet.create({
  default: { backgroundColor: 'transparent' },
  primary: { backgroundColor: colors.softPrimary, borderWidth: 1, borderColor: colors.softPrimaryBorder },
  danger: { backgroundColor: colors.softDanger, borderWidth: 1, borderColor: colors.softDangerBorder },
  ghost: { backgroundColor: 'transparent' },
});
