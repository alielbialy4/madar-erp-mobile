import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';

type IconName = Parameters<typeof AppIcon>[0]['name'];

type Props = {
  title?: string;
  message?: string;
  icon?: string;
  action?: React.ReactNode;
  ctaLabel?: string;
  onCtaPress?: () => void;
};

export function AppEmptyState({
  title = 'لا توجد بيانات',
  message,
  icon = 'tray',
  action,
  ctaLabel,
  onCtaPress,
}: Props) {
  const c = useColors();
  const cta = action ?? (ctaLabel && onCtaPress ? (
    <AppButton title={ctaLabel} onPress={onCtaPress} variant="secondary" />
  ) : null);
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[c.accent + '15', c.accent + '05', 'transparent']}
        style={styles.iconBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AppIcon name={icon as IconName} size={32} weight="duotone" color={c.accent} />
      </LinearGradient>
      <AppText style={{
        fontSize: typography.subtitle,
        fontFamily: fonts.bold,
        color: c.text,
        textAlign: 'center',
        writingDirection: 'rtl',
      }}>
        {title}
      </AppText>
      {message ? <AppText style={{
        fontSize: typography.body,
        color: c.textMuted,
        textAlign: 'center',
        writingDirection: 'rtl',
        lineHeight: 22,
        maxWidth: 280,
      }}>{message}</AppText> : null}
      {cta}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
