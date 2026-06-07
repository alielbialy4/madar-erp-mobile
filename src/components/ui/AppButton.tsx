import React, { useRef, useCallback } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  const isGradient = variant === 'primary' || variant === 'danger' || variant === 'success';

  const solidBg = isGradient
    ? c.primary
    : variant === 'secondary' ? c.surfaceMuted
    : variant === 'outline' ? c.surface
    : 'transparent';

  const fg = variant === 'primary'
    ? c.primaryForeground
    : variant === 'danger' || variant === 'success'
      ? c.onPrimary
    : variant === 'ghost' ? c.primary : c.text;

  const borderColor = variant === 'outline' ? c.border
    : variant === 'secondary' ? c.border
    : variant === 'ghost' ? 'transparent'
    : 'transparent';

  const minHeight = size === 'sm' ? 40 : size === 'lg' ? 48 : size === 'xl' ? 58 : 44;
  const px = size === 'sm' ? spacing.md : size === 'lg' ? spacing.xxl : size === 'xl' ? spacing.xxxl : spacing.lg;
  const titleSize = size === 'sm' ? typography.label : size === 'xl' ? typography.sectionTitle : typography.body;

  const gradientColors: [string, string] = variant === 'danger'
    ? [c.danger, c.danger + 'DD']
    : variant === 'success'
    ? [c.success, c.success + 'DD']
    : [c.primary, c.primary + 'DD'];

  const buttonContent = (
    <>
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
    </>
  );

  if (isGradient && !isDisabled) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleRef }], borderRadius: radius.button, overflow: 'hidden' }}>
        <Pressable
          accessibilityRole="button"
          onPress={isDisabled ? undefined : onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            { opacity: pressed ? 0.88 : 1 },
            fullWidth && { width: '100%' },
            style,
          ]}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              minHeight,
              borderRadius: radius.button,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              paddingHorizontal: px,
              gap: spacing.sm,
              shadowColor: gradientColors[0],
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {buttonContent}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

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
            borderWidth: StyleSheet.hairlineWidth,
            borderColor,
            backgroundColor: solidBg,
            gap: spacing.sm,
            opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
          },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {buttonContent}
      </Pressable>
    </Animated.View>
  );
}
