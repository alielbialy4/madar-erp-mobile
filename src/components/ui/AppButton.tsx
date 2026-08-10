import React, { useCallback, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { appWritingDirection } from '@/constants/layout';

type Variant = 'primary' | 'secondary' | 'danger' | 'dangerGhost' | 'ghost' | 'outline' | 'success';
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
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = Boolean(disabled || loading);

  const handlePressIn = useCallback(() => {
    if (!isDisabled) {
      Animated.spring(scale, { toValue: 0.98, friction: 7, tension: 240, useNativeDriver: true }).start();
    }
  }, [isDisabled, scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, friction: 7, tension: 180, useNativeDriver: true }).start();
  }, [scale]);

  const backgroundColor = variant === 'primary'
    ? c.primary
    : variant === 'danger'
      ? c.danger
      : variant === 'success'
        ? c.success
        : variant === 'secondary'
          ? c.surfaceMuted
          : variant === 'outline'
            ? c.surface
            : 'transparent';

  const foregroundColor = variant === 'primary'
    ? c.primaryForeground
    : variant === 'danger' || variant === 'success'
      ? c.onPrimary
      : variant === 'dangerGhost'
        ? c.danger
        : variant === 'ghost'
          ? c.primary
          : c.text;

  const borderColor = variant === 'outline' || variant === 'secondary' ? c.border : 'transparent';
  const minHeight = size === 'sm' ? 40 : size === 'lg' ? 48 : size === 'xl' ? 52 : 48;
  const horizontalPadding = size === 'sm' ? spacing.md : size === 'lg' ? spacing.xxl : size === 'xl' ? spacing.xxxl : spacing.lg;
  const titleSize = size === 'sm' ? typography.label : size === 'xl' ? typography.cardTitle : typography.body;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.fullWidth]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
        onPress={isDisabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.button,
          {
            minHeight,
            paddingHorizontal: horizontalPadding,
            backgroundColor,
            borderColor,
            opacity: isDisabled ? 0.48 : pressed ? 0.84 : 1,
          },
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={foregroundColor} />
        ) : (
          <>
            {icon}
            <AppText style={[styles.label, { color: foregroundColor, fontSize: titleSize }]}>{title}</AppText>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  fullWidth: { width: '100%' },
  label: {
    fontFamily: fonts.bold,
    fontWeight: '700',
    writingDirection: appWritingDirection,
    textAlign: 'center',
  },
});
