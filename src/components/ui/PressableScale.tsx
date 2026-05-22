import React, { useCallback, useRef } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = PressableProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
  disabled?: boolean;
};

export function PressableScale({
  children,
  style,
  pressedScale = 0.97,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scaleRef = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      if (!disabled) {
        Animated.spring(scaleRef, { toValue: pressedScale, friction: 5, tension: 280, useNativeDriver: true }).start();
      }
      onPressIn?.(e);
    },
    [disabled, onPressIn, pressedScale, scaleRef],
  );

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      Animated.spring(scaleRef, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
      onPressOut?.(e);
    },
    [onPressOut, scaleRef],
  );

  return (
    <Animated.View style={[{ transform: [{ scale: scaleRef }] }, style]}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
