import React, { PropsWithChildren, useRef, useCallback } from 'react';
import { Animated, Pressable, Platform, View, ViewStyle, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';

type Props = PropsWithChildren<{
  style?: ViewStyle;
  padded?: boolean;
  onPress?: () => void;
  elevated?: boolean;
  variant?: 'default' | 'flat';
}>;

export function AppCard({ children, style, padded = true, onPress, elevated = true, variant = 'default' }: Props) {
  const c = useColors();
  const scaleRef = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (onPress) {
      Animated.spring(scaleRef, { toValue: 0.97, friction: 5, tension: 300, useNativeDriver: true }).start();
    }
  }, [onPress, scaleRef]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleRef, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
  }, [scaleRef]);

  const bg = variant === 'flat' ? c.surfaceMuted : c.surface;
  const borderWidth = 1;
  const borderColor = c.borderSubtle;

  const cardStyle = {
    backgroundColor: bg,
    borderWidth,
    borderColor,
    borderRadius: radius.card,
    padding: padded ? spacing.cardPadding : 0,
    overflow: 'hidden' as const,
    ...(elevated && variant !== 'flat'
      ? Platform.select({
          ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.8, shadowRadius: 12 },
          android: { elevation: 3 },
          default: { boxShadow: `0 4px 12px ${c.shadowMd}` } as object,
        })
      : {}),
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
