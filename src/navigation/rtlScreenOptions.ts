import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { isRtl } from '@/utils/rtl';

/** Shared stack options — back gesture follows app reading direction. */
export const rtlStackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: isRtl ? 'slide_from_left' : 'slide_from_right',
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  gestureDirection: 'horizontal',
};
