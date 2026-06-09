import { NativeModules, Platform } from 'react-native';
import { VIEW_SHOT_UNAVAILABLE_MESSAGE } from './viewShotMessages';

export { VIEW_SHOT_UNAVAILABLE_MESSAGE };

let cached: boolean | null = null;

/** True when react-native-view-shot native module is linked (Dev/Production build — not Expo Go). */
export function isViewShotAvailable(): boolean {
  if (cached !== null) return cached;
  if (Platform.OS === 'web') {
    cached = false;
    return false;
  }
  cached = Boolean(NativeModules.RNViewShot);
  return cached;
}

export function assertViewShotAvailable(): void {
  if (!isViewShotAvailable()) {
    throw new Error(VIEW_SHOT_UNAVAILABLE_MESSAGE);
  }
}
