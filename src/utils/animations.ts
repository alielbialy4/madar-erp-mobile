import { Animated, Easing } from 'react-native';

export function pressScale(pressed: boolean, scale = 0.96) {
  return { transform: [{ scale: pressed ? scale : 1 }] };
}

export function fadeIn(value: Animated.Value, duration = 220) {
  Animated.timing(value, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start();
}

export function slideInX(value: Animated.Value, from: number, duration = 280) {
  value.setValue(from);
  Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start();
}

export function tabPulse(value: Animated.Value) {
  value.setValue(0.85);
  Animated.spring(value, {
    toValue: 1,
    friction: 4,
    tension: 120,
    useNativeDriver: true,
  }).start();
}

export function animateTabIndicator(
  translateX: Animated.Value,
  width: Animated.Value,
  toX: number,
  toW: number,
) {
  Animated.parallel([
    Animated.spring(translateX, {
      toValue: toX,
      friction: 9,
      tension: 90,
      useNativeDriver: false,
    }),
    Animated.spring(width, {
      toValue: toW,
      friction: 9,
      tension: 90,
      useNativeDriver: false,
    }),
  ]).start();
}
