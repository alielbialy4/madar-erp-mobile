import React, { PropsWithChildren, useRef, useCallback } from 'react';
import { Animated, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';

type Props = PropsWithChildren<{
  style?: ViewStyle;
  padded?: boolean;
  onPress?: () => void;
  elevated?: boolean;
  variant?: 'default' | 'flat';
}>;

export function AppCard({ children, style, padded = true, onPress, elevated = false, variant = 'default' }: Props) {
  const c = useColors();
  const scaleRef = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (onPress) {
      Animated.spring(scaleRef, { toValue: 0.99, friction: 6, tension: 260, useNativeDriver: true }).start();
    }
  }, [onPress, scaleRef]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleRef, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
  }, [scaleRef]);

  const bg = variant === 'flat' ? c.surfaceMuted : c.surface;
  const borderColor = c.borderSubtle;

  const cardStyle = {
    backgroundColor: bg,
    borderWidth: elevated ? 1 : StyleSheet.hairlineWidth,
    borderColor: elevated ? c.border : borderColor,
    borderRadius: radius.lg,
    padding: padded ? spacing.cardPadding : 0,
    overflow: 'hidden' as const,
  };

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleRef }] }}>
        <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={[cardStyle, style]}>
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
