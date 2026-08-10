import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
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
      <View
        style={[
          styles.iconBg,
          { backgroundColor: c.surfaceMuted, borderColor: c.borderSubtle },
        ]}
      >
        <AppIcon name={icon as IconName} size={24} weight="regular" color={c.textMuted} />
      </View>
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
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
