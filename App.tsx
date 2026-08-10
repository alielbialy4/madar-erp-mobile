import './src/bootstrap/rtl';
import { applyEarlyRtlDefaults } from './src/bootstrap/typography';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { rootRtl, isRtl } from './src/constants/layout';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { useAuthStore } from './src/store/authStore';
import { useNetworkStore } from './src/store/networkStore';
import { useThemeStore } from './src/store/themeStore';
import { useLocaleStore } from './src/store/localeStore';
import { useImmersiveStore } from './src/store/immersiveStore';
import { FontProvider } from './src/providers/FontProvider';
import { RtlProvider } from './src/components/layout/RtlProvider';
import { AppToastProvider } from './src/components/feedback/AppToast';
import { AppDialogProvider } from './src/components/feedback/AppDialogHost';
import { PrintCaptureHost } from './src/components/printing/PrintCaptureHost';
import { getColors } from './src/constants/colors';
import { fonts } from './src/constants/fonts';
import { i18n } from './src/i18n';
import { useImmersiveSystemUi } from './src/hooks/useImmersiveSystemUi';
applyEarlyRtlDefaults();

export default function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const startNetworkListener = useNetworkStore((state) => state.start);
  const themeBootstrap = useThemeStore((state) => state.bootstrap);
  const localeBootstrap = useLocaleStore((state) => state.bootstrap);
  const localeHydrated = useLocaleStore((state) => state.hydrated);
  const language = useLocaleStore((state) => state.language);
  const theme = useThemeStore((state) => state.theme);
  const primaryHex = useThemeStore((state) => state.primaryHex);
  const immersive = useImmersiveStore((state) => state.enabled);
  const [localeReady, setLocaleReady] = useState(localeHydrated);

  useImmersiveSystemUi(immersive);

  const navTheme = useMemo(() => {
    const c = getColors(theme, primaryHex);
    const base = theme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: c.primary,
        background: c.background,
        card: c.surface,
        text: c.text,
        border: c.border,
      },
      fonts: {
        regular: { fontFamily: fonts.regular, fontWeight: '400' as const },
        medium: { fontFamily: fonts.medium, fontWeight: '500' as const },
        bold: { fontFamily: fonts.bold, fontWeight: '700' as const },
        heavy: { fontFamily: fonts.extraBold, fontWeight: '800' as const },
      },
    };
  }, [primaryHex, theme]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await localeBootstrap();
      if (!cancelled) setLocaleReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [localeBootstrap]);

  useEffect(() => {
    if (!localeReady) return;
    const stop = startNetworkListener();
    void bootstrap();
    void themeBootstrap();
    return stop;
  }, [bootstrap, localeReady, startNetworkListener, themeBootstrap]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (!localeReady) {
    return (
      <View style={[styles.root, styles.boot]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <I18nextProvider i18n={i18n}>
        <RtlProvider>
          <FontProvider>
            <SafeAreaProvider>
              <AppToastProvider>
                <AppDialogProvider>
                  <PrintCaptureHost />
                  <NavigationContainer
                    ref={navigationRef}
                    direction={isRtl ? 'rtl' : 'ltr'}
                    theme={navTheme}
                    key={language}
                  >
                    <RootNavigator />
                    <StatusBar
                      style={theme === 'dark' ? 'light' : 'dark'}
                      hidden={immersive}
                    />
                  </NavigationContainer>
                </AppDialogProvider>
              </AppToastProvider>
            </SafeAreaProvider>
          </FontProvider>
        </RtlProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { ...rootRtl },
  boot: { alignItems: 'center', justifyContent: 'center' },
});
