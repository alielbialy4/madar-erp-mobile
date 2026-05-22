import React, { PropsWithChildren, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { applyGlobalTypography } from '@/bootstrap/typography';
import { fonts } from '@/constants/fonts';
import {
  useFonts,
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  Tajawal_800ExtraBold,
  Tajawal_900Black,
} from '@expo-google-fonts/tajawal';
import { useColors } from '@/hooks/useColors';
import { rootRtl } from '@/constants/layout';

export function FontProvider({ children }: PropsWithChildren) {
  const c = useColors();
  const [loaded] = useFonts({
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
    Tajawal_800ExtraBold,
    Tajawal_900Black,
  });

  useEffect(() => {
    if (loaded) applyGlobalTypography();
  }, [loaded]);

  if (loaded) applyGlobalTypography();

  if (!loaded) {
    return (
      <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }, rootRtl]}>
        <ActivityIndicator color={c.accent} size="large" />
        <Text style={{ marginTop: 12, fontFamily: fonts.medium, color: c.textMuted, writingDirection: 'rtl' }}>
          جاري تحميل الخط…
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
