import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/AppText';
import { ALERT_BANNER, alertTonePalette, type AlertTone } from '@/constants/alertChrome';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';
import { radius } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

type Props = {
  message: string;
  tone?: AlertTone;
};

export function AppInlineAlert({ message, tone = 'warning' }: Props) {
  const c = useColors();
  const palette = alertTonePalette(c, tone);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          ...flexRow,
          alignItems: 'flex-start',
          gap: ALERT_BANNER.gap,
          paddingHorizontal: ALERT_BANNER.paddingX,
          paddingVertical: ALERT_BANNER.paddingY,
          borderRadius: ALERT_BANNER.radius,
          borderWidth: ALERT_BANNER.borderWidth,
          borderColor: palette.border,
          backgroundColor: palette.bg,
        },
        iconWell: {
          width: ALERT_BANNER.iconWell,
          height: ALERT_BANNER.iconWell,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.border,
          marginTop: 1,
        },
        text: {
          ...textStart,
          flex: 1,
          minWidth: 0,
          color: c.text,
          fontFamily: fonts.medium,
          fontSize: ALERT_BANNER.messageSize,
          lineHeight: ALERT_BANNER.lineHeight,
        },
      }),
    [c.surface, c.text, palette],
  );

  return (
    <View style={styles.root} accessibilityRole="alert">
      <View style={styles.iconWell}>
        <MaterialIcons name={palette.icon} size={ALERT_BANNER.iconSize} color={palette.fg} />
      </View>
      <AppText style={styles.text}>{message}</AppText>
    </View>
  );
}
