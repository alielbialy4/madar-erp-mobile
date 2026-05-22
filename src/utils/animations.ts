import { Animated, Easing } from 'react-native';

export function slideInX(anim: Animated.Value, fromValue: number, toValue = 0, duration = 280) {
  anim.setValue(fromValue);
  Animated.timing(anim, {
    toValue,
    duration,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    useNativeDriver: true,
  }).start();
}

export function slideOutX(anim: Animated.Value, toValue: number, duration = 220) {
  Animated.timing(anim, {
    toValue,
    duration,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    useNativeDriver: true,
  }).start();
}

export function fadeIn(anim: Animated.Value, duration = 250) {
  anim.setValue(0);
  Animated.timing(anim, {
    toValue: 1,
    duration,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    useNativeDriver: true,
  }).start();
}

export function fadeOut(anim: Animated.Value, duration = 200) {
  Animated.timing(anim, {
    toValue: 0,
    duration,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    useNativeDriver: true,
  }).start();
}

export function scaleIn(anim: Animated.Value, from = 0.92, duration = 200) {
  anim.setValue(from);
  Animated.spring(anim, {
    toValue: 1,
    friction: 7,
    tension: 180,
    useNativeDriver: true,
  }).start();
}

export function pressScale(anim: Animated.Value, pressed: boolean) {
  Animated.spring(anim, {
    toValue: pressed ? 0.94 : 1,
    friction: 5,
    tension: 200,
    useNativeDriver: true,
  }).start();
}

export function createPulseValue(): Animated.Value {
  return new Animated.Value(1);
}

export function pulse(anim: Animated.Value) {
  Animated.loop(
    Animated.sequence([
      Animated.timing(anim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]),
  ).start();
}

export const SCREEN_TRANSITION = {
  duration: 220,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};
