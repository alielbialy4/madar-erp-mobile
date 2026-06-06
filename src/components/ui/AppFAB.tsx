import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { elevation } from '@/constants/elevation';
import { radius, spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';

type Props = {
  onPress: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function AppFAB({ onPress, icon = 'add', accessibilityLabel = 'إضافة', style }: Props) {
  const c = useColors();
  const bottom = useTabBarBottomInset(spacing.lg);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          position: 'absolute',
          bottom,
          end: spacing.lg,
          width: 56,
          height: 56,
          borderRadius: radius.pill,
          backgroundColor: c.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...elevation(c, 'lg'),
        },
        style,
      ]}
    >
      <MaterialIcons name={icon} size={26} color={c.onPrimary} />
    </Pressable>
  );
}
