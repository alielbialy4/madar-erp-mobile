import { useEffect } from 'react';
import { Platform } from 'react-native';
import { setStatusBarHidden } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';

/** Hide/show system chrome when immersive mode toggles. */
export function useImmersiveSystemUi(enabled: boolean) {
  useEffect(() => {
    setStatusBarHidden(enabled, 'fade');

    if (Platform.OS !== 'android') return;

    NavigationBar.setHidden(enabled);

    return () => {
      if (!enabled) return;
      NavigationBar.setHidden(false);
      setStatusBarHidden(false, 'fade');
    };
  }, [enabled]);
}
