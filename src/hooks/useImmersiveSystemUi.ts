import { useEffect } from 'react';
import { Platform } from 'react-native';
import { setStatusBarHidden } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

/** Hide/show system chrome when immersive mode toggles. */
export function useImmersiveSystemUi(enabled: boolean) {
  useEffect(() => {
    setStatusBarHidden(enabled, 'fade');

    if (Platform.OS !== 'android') return;

    let cancelled = false;
    void (async () => {
      try {
        await NavigationBar.setVisibilityAsync(enabled ? 'hidden' : 'visible');
        if (!cancelled && enabled) {
          await NavigationBar.setBehaviorAsync('overlay-swipe');
        }
      } catch {
        /* Expo Go / unsupported builds */
      }
    })();

    return () => {
      cancelled = true;
      if (!enabled) return;
      void NavigationBar.setVisibilityAsync('visible').catch(() => undefined);
      setStatusBarHidden(false, 'fade');
    };
  }, [enabled]);
}
