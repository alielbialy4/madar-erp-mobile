import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/** Shared stack options — gestures follow RTL when I18nManager.isRTL is true */
export const rtlStackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  gestureDirection: 'horizontal',
};
