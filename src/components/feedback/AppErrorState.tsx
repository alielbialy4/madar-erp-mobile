import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { textStart, appWritingDirection } from '@/constants/layout';

type IconName = Parameters<typeof AppIcon>[0]['name'];

type Props = {
  message?: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

function splitMessage(
  message: string,
  fallbackLatin: string,
  fallbackLong: string,
): { summary: string; detail: string | null } {
  const trimmed = message.trim();
  const latinCharacters = (trimmed.match(/[A-Za-z]/g) ?? []).length;
  if (latinCharacters > trimmed.length * 0.35) {
    return { summary: fallbackLatin, detail: trimmed };
  }
  if (trimmed.length <= 96) return { summary: trimmed, detail: null };
  const firstPeriod = trimmed.indexOf('. ');
  if (firstPeriod > 0 && firstPeriod < 120) {
    return {
      summary: trimmed.slice(0, firstPeriod + 1),
      detail: trimmed.slice(firstPeriod + 2),
    };
  }
  return {
    summary: fallbackLong,
    detail: trimmed,
  };
}

export function AppErrorState({
  message,
  title,
  onRetry,
  retryLabel,
}: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const resolvedMessage = message ?? t('mobile.common.errorTitle');
  const resolvedTitle = title ?? t('mobile.common.errorTitle');
  const resolvedRetry = retryLabel ?? t('mobile.common.retry');
  const { summary, detail } = useMemo(
    () =>
      splitMessage(
        resolvedMessage,
        t('mobile.errors.loadFailed'),
        t('mobile.errors.loadFailedRetry'),
      ),
    [resolvedMessage, t],
  );
  const isNetwork = /اتصال|خادم|EXPO_PUBLIC_API_URL|انتهت مهلة|network|server|timeout/i.test(
    resolvedMessage,
  );

  return (
    <View style={styles.container}>
      <View style={[styles.iconBg, { backgroundColor: c.softDanger, borderColor: c.softDangerBorder }]}>
        <AppIcon
          name={(isNetwork ? 'cloud-slash' : 'warning-octagon') as IconName}
          size={28}
          weight="regular"
          color={c.danger}
        />
      </View>

      <View style={styles.textBlock}>
        <AppText style={{
          fontSize: typography.sectionTitle,
          fontFamily: fonts.extraBold,
          color: c.text,
          textAlign: 'center',
          writingDirection: appWritingDirection,
        }}>{resolvedTitle}</AppText>
        <AppText style={{
          fontSize: typography.body,
          fontFamily: fonts.medium,
          color: c.text,
          textAlign: 'center',
          writingDirection: appWritingDirection,
          lineHeight: 24,
        }}>{summary}</AppText>

        {detail ? (
          <ScrollView
            style={[styles.detailBox, { backgroundColor: c.surfaceMuted, borderColor: c.borderSubtle }]}
            contentContainerStyle={{ padding: spacing.md }}
          >
            <AppText style={{
              ...textStart,
              fontSize: typography.tiny,
              fontFamily: fonts.regular,
              color: c.textCaption,
              lineHeight: 18,
            }}>{detail}</AppText>
          </ScrollView>
        ) : null}
      </View>

      {onRetry ? <AppButton title={resolvedRetry} variant="primary" onPress={onRetry} size="default" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  textBlock: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.sm,
    alignItems: 'center',
  },
  detailBox: {
    width: '100%',
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
