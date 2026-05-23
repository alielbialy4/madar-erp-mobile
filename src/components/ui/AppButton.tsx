import React, { useRef, useCallback } from 'react';
import { ActivityIndicator, Animated, Pressable, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
type Size = 'sm' | 'default' | 'lg' | 'xl';

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

  const bg = variant === 'primary' ? c.primary
    : variant === 'danger' ? c.danger
    : variant === 'success' ? c.success
    : variant === 'secondary' ? c.surfaceMuted
    : variant === 'outline' ? c.surface
    : 'transparent';

  const fg = variant === 'primary'
    ? c.primaryForeground
    : variant === 'danger' || variant === 'success'
      ? '#FFFFFF'
    : variant === 'ghost' ? c.primary : c.text;

  const borderColor = variant === 'outline' ? c.border
    : variant === 'secondary' ? c.border
    : variant === 'ghost' ? 'transparent'
    : bg;

  const minHeight = size === 'sm' ? 40 : size === 'lg' ? 48 : size === 'xl' ? 58 : 44;
  const px = size === 'sm' ? spacing.md : size === 'lg' ? spacing.xxl : size === 'xl' ? spacing.xxxl : spacing.lg;
  const titleSize = size === 'sm' ? typography.label : size === 'xl' ? typography.sectionTitle : typography.body;

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
            <AppText style={{ fontSize: titleSize, fontFamily: fonts.bold, fontWeight: '700', color: fg, writingDirection: 'rtl', textAlign: 'center' }}>
              {title}
            </AppText>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
