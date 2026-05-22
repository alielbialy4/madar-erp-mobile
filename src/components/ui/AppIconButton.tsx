import React from 'react';
import { Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/useColors';
import { radius } from '@/constants/spacing';

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  size?: number;
  color?: string;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  accessibilityLabel?: string;
  style?: any;
};

export function AppIconButton({ icon, onPress, disabled, size = 22, color, variant = 'default', accessibilityLabel, style }: Props) {
  const c = useColors();
  const iconColor = color ?? (variant === 'primary' ? c.accent : variant === 'danger' ? c.danger : c.text);
  const bg = variant === 'primary' ? c.softPrimary : variant === 'danger' ? c.softDanger : 'transparent';
  const border = variant === 'primary' ? c.softPrimaryBorder : variant === 'danger' ? c.softDangerBorder : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 40,
          height: 40,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? c.surfaceMuted : bg,
          borderWidth: variant === 'ghost' ? 0 : 1,
          borderColor: border,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      <MaterialIcons name={icon} size={size} color={iconColor} />
    </Pressable>
  );
}
