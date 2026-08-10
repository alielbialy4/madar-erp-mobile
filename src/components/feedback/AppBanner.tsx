import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { ALERT_BANNER, alertTonePalette, type AlertTone } from '@/constants/alertChrome';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';
import { radius } from '@/constants/spacing';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type Props = {
  message: string;
  tone?: AlertTone;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
};

export function AppBanner({ message, tone = 'warning', icon, actionLabel, onAction, onDismiss }: Props) {
  const c = useColors();
  const palette = alertTonePalette(c, tone);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          ...flexRow,
          alignItems: 'flex-start',
          gap: ALERT_BANNER.gap,
          backgroundColor: palette.bg,
          borderWidth: ALERT_BANNER.borderWidth,
          borderColor: palette.border,
          borderRadius: ALERT_BANNER.radius,
          paddingHorizontal: ALERT_BANNER.paddingX,
          paddingVertical: ALERT_BANNER.paddingY,
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
          color: c.text,
          fontSize: ALERT_BANNER.messageSize,
          fontFamily: fonts.medium,
          fontWeight: '500',
          lineHeight: ALERT_BANNER.lineHeight,
          flex: 1,
          minWidth: 0,
          ...textStart,
        },
        action: {
          color: palette.fg,
          fontSize: ALERT_BANNER.titleSize,
          fontFamily: fonts.bold,
          fontWeight: '700',
          paddingTop: 1,
        },
        dismiss: {
          paddingTop: 2,
        },
      }),
    [c.surface, palette],
  );

  return (
    <View style={styles.root} accessibilityRole="alert">
      <View style={styles.iconWell}>
        <MaterialIcons name={icon ?? palette.icon} size={ALERT_BANNER.iconSize} color={palette.fg} />
      </View>
      <AppText style={styles.text}>{message}</AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <AppText style={styles.action}>{actionLabel}</AppText>
        </Pressable>
      ) : null}
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="إغلاق" style={styles.dismiss}>
          <MaterialIcons name="close" size={16} color={palette.fg} />
        </Pressable>
      ) : null}
    </View>
  );
}
