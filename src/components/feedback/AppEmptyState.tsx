import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { appWritingDirection } from '@/constants/layout';

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
  title,
  message,
  icon = 'tray',
  action,
  ctaLabel,
  onCtaPress,
}: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const resolvedTitle = title ?? t('mobile.common.emptyTitle');
  const cta =
    action ??
    (ctaLabel && onCtaPress ? <AppButton title={ctaLabel} onPress={onCtaPress} variant="secondary" /> : null);
  return (
    <View style={styles.container}>
      <View style={[styles.iconBg, { backgroundColor: c.surfaceMuted, borderColor: c.borderSubtle }]}>
        <AppIcon name={icon as IconName} size={24} weight="regular" color={c.textMuted} />
      </View>
      <AppText
        style={{
          fontSize: typography.subtitle,
          fontFamily: fonts.bold,
          color: c.text,
          textAlign: 'center',
          writingDirection: appWritingDirection,
        }}
      >
        {resolvedTitle}
      </AppText>
      {message ? (
        <AppText
          style={{
            fontSize: typography.body,
            color: c.textMuted,
            textAlign: 'center',
            writingDirection: appWritingDirection,
            lineHeight: 22,
            maxWidth: 280,
          }}
        >
          {message}
        </AppText>
      ) : null}
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
