import React, { useRef, useCallback } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
type Size = 'sm' | 'default' | 'lg';

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
  fullWidth?: boolean;
  icon?: React.ReactNode;
};

export function AppButton({ title, onPress, disabled, loading, variant = 'primary', size = 'default', style, fullWidth, icon }: Props) {
  const c = useColors();
  const scaleRef = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const handlePressIn = useCallback(() => {
    if (!isDisabled) {
      Animated.spring(scaleRef, { toValue: 0.96, friction: 5, tension: 200, useNativeDriver: true }).start();
    }
  }, [isDisabled, scaleRef]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleRef, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
  }, [scaleRef]);

  const bg = variant === 'primary' ? c.accent
    : variant === 'danger' ? c.danger
    : variant === 'success' ? c.success
    : variant === 'secondary' ? c.surfaceMuted
    : variant === 'outline' ? c.surface
    : 'transparent';

  const fg = variant === 'primary' || variant === 'danger' || variant === 'success'
    ? c.primaryForeground
    : variant === 'ghost' ? c.accent : c.text;

  const borderColor = variant === 'outline' ? c.border
    : variant === 'secondary' ? c.border
    : variant === 'ghost' ? 'transparent'
    : bg;

  const minHeight = size === 'sm' ? 40 : size === 'lg' ? 48 : 44;
  const px = size === 'sm' ? spacing.md : size === 'lg' ? spacing.xxl : spacing.lg;

  return (
    <Animated.View style={{ transform: [{ scale: scaleRef }] }}>
      <Pressable
        accessibilityRole="button"
        onPress={isDisabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          {
            minHeight,
            borderRadius: radius.button,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            paddingHorizontal: px,
            borderWidth: 1,
            borderColor,
            backgroundColor: bg,
            gap: spacing.sm,
            opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
          },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : (
          <>
            {icon}
            <Text style={{ fontSize: size === 'sm' ? typography.label : typography.body, fontFamily: fonts.bold, fontWeight: '700', color: fg, writingDirection: 'rtl' }}>
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
