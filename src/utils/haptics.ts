import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

async function safeImpact(style: Haptics.ImpactFeedbackStyle) {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(style);
  } catch {
    // Haptics unavailable on some devices/simulators
  }
}

async function safeNotification(type: Haptics.NotificationFeedbackType) {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(type);
  } catch {
    // noop
  }
}

export const hapticLight = () => safeImpact(Haptics.ImpactFeedbackStyle.Light);
export const hapticMedium = () => safeImpact(Haptics.ImpactFeedbackStyle.Medium);
export const hapticSuccess = () => safeNotification(Haptics.NotificationFeedbackType.Success);
export const hapticError = () => safeNotification(Haptics.NotificationFeedbackType.Error);
export const hapticWarning = () => safeNotification(Haptics.NotificationFeedbackType.Warning);
