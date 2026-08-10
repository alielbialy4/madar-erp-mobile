import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow } from '@/constants/layout';

type IconName = ComponentProps<typeof MaterialIcons>['name'];
type Tone = 'warning' | 'danger' | 'info' | 'success';

type Props = {
  message: string;
  tone?: Tone;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
};

function toneColors(c: AppColors, tone: Tone) {
  switch (tone) {
    case 'danger':
      return { bg: c.softDanger, border: c.softDangerBorder, fg: c.danger, icon: 'error-outline' as IconName };
    case 'info':
      return { bg: c.softPrimary, border: c.softPrimaryBorder, fg: c.info, icon: 'info-outline' as IconName };
    case 'success':
      return { bg: c.softSuccess, border: c.softSuccessBorder, fg: c.success, icon: 'check-circle-outline' as IconName };
    default:
      return { bg: c.softWarning, border: c.softWarningBorder, fg: c.warning, icon: 'warning-amber' as IconName };
  }
}

export function AppBanner({ message, tone = 'warning', icon, actionLabel, onAction, onDismiss }: Props) {
  const c = useColors();
  const colors = toneColors(c, tone);
  const styles = useMemo(() => StyleSheet.create({
    root: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    text: {
      color: colors.fg,
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      fontWeight: '700',
      flex: 1,
      writingDirection: 'rtl',
    },
    action: {
      color: colors.fg,
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      fontWeight: '700',
    },
  }), [colors]);

  return (
    <View style={styles.root} accessibilityRole="alert">
      <MaterialIcons name={icon ?? colors.icon} size={16} color={colors.fg} />
      <AppText style={styles.text}>{message}</AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <AppText style={styles.action}>{actionLabel}</AppText>
        </Pressable>
      ) : null}
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="إغلاق">
          <MaterialIcons name="close" size={16} color={colors.fg} />
        </Pressable>
      ) : null}
    </View>
  );
}
