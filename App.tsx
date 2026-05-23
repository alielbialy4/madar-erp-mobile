import './src/bootstrap/rtl';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { useNetworkStore } from './src/store/networkStore';
import { useThemeStore } from './src/store/themeStore';
import { FontProvider } from './src/providers/FontProvider';
import { RtlProvider } from './src/components/layout/RtlProvider';
import { getColors } from './src/constants/colors';
import { fonts } from './src/constants/fonts';

export default function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const startNetworkListener = useNetworkStore((state) => state.start);
  const themeBootstrap = useThemeStore((state) => state.bootstrap);
  const theme = useThemeStore((state) => state.theme);
  const primaryHex = useThemeStore((state) => state.primaryHex);

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
    const stop = startNetworkListener();
    void bootstrap();
    void themeBootstrap();
    return stop;
  }, [bootstrap, startNetworkListener, themeBootstrap]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <RtlProvider>
        <FontProvider>
          <SafeAreaProvider>
            <NavigationContainer direction="rtl" theme={navTheme}>
              <RootNavigator />
              <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            </NavigationContainer>
          </SafeAreaProvider>
        </FontProvider>
      </RtlProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
